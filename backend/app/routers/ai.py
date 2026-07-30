import json
import logging
import re
from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import get_db
from app.routers.ai_helpers import AI_HISTORY_MAX_MESSAGES, AI_SESSION_MAX, get_session_state
from app.routers.common import latest_prices_query
from app.schemas.schemas import AIChatRequest, AIChatResponse
from app.services.market_average import build_market_average_batch
from app.store_metadata import get_store_metadata

router = APIRouter()
logger = logging.getLogger(__name__)


def build_price_context(db: Session) -> list:
    prices = latest_prices_query(db).all()
    market_by_product = {
        item["product_id"]: item
        for item in build_market_average_batch(
            db,
            product_ids=sorted({p.product_id for p in prices}),
        )
    }
    accepted_store_ids = {
        product_id: {price["store_id"] for price in market.get("accepted_prices", [])}
        for product_id, market in market_by_product.items()
    }

    data = []
    for p in prices:
        market = market_by_product.get(p.product_id) or {}
        accepted_ids = accepted_store_ids.get(p.product_id)
        if accepted_ids and p.store_id not in accepted_ids:
            continue
        data.append({
            "product": p.product.name,
            "model": p.product.model,
            "capacity": p.product.capacity,
            "store": p.store.name,
            "price": p.price,
            "profit": p.profit,
            "retail_price": p.product.retail_price,
            "market_average": market.get("market_average"),
            "market_median": market.get("median_price"),
            "market_confidence": market.get("confidence_label"),
            "market_store_count": market.get("accepted_store_count"),
            "market_spread": market.get("spread"),
            "store_url": p.store.website_url or get_store_metadata(p.store.name).get("website_url"),
            "store_phone": get_store_metadata(p.store.name).get("phone"),
            "store_address": get_store_metadata(p.store.name).get("address"),
            "store_summary": get_store_metadata(p.store.name).get("summary"),
            "is_sponsored": get_store_metadata(p.store.name).get("is_sponsored", False),
            "price_url": p.url,
        })

    return data


def build_simple_price_context(db: Session) -> list:
    prices = latest_prices_query(db).all()
    market_by_product = {
        item["product_id"]: item
        for item in build_market_average_batch(
            db,
            product_ids=sorted({p.product_id for p in prices}),
        )
    }
    accepted_store_ids = {
        product_id: {price["store_id"] for price in market.get("accepted_prices", [])}
        for product_id, market in market_by_product.items()
    }

    grouped: dict[str, dict] = {}
    for p in prices:
        accepted_ids = accepted_store_ids.get(p.product_id)
        if accepted_ids and p.store_id not in accepted_ids:
            continue
        model = p.product.model if p.product else None
        capacity = p.product.capacity if p.product and p.product.capacity else None
        product_label = f"{model} {capacity}".strip() if model else None
        store_name = p.store.name if p.store else None
        if not product_label or not store_name:
            continue
        grouped.setdefault(product_label, {"product_id": p.product_id, "items": []})
        grouped[product_label]["items"].append((store_name, p.price))

    data = []
    for product_label, payload in grouped.items():
        items = payload["items"]
        top5 = sorted(items, key=lambda item: item[1], reverse=True)[:5]
        compact = ",".join(f"{store}:{price}" for store, price in top5)
        market = market_by_product.get(payload["product_id"])
        if market and market.get("market_average"):
            compact = (
                f"{compact},市場平均:{market.get('market_average')},"
                f"中央値:{market.get('median_price')},信頼:{market.get('confidence_label')}"
            )
        data.append(f"{product_label}:[{compact}]")
    return data


def normalize_text(text: str) -> str:
    text = text.lower()
    text = text.replace("promax", "pro max")
    text = re.sub(r"iphone\s*(\d{2})", r"iphone \1", text)
    text = re.sub(r"(\d)\s*tb", lambda m: f"{int(m.group(1)) * 1024}gb", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def normalize_capacity(value: str | None) -> str | None:
    if not value:
        return None
    text = str(value).strip().lower().replace(" ", "")
    if text.endswith("tb"):
        tb = text[:-2]
        if tb.isdigit():
            return str(int(tb) * 1024)
    if text.endswith("gb"):
        text = text[:-2]
    if text.isdigit():
        return text
    return None


def extract_variant(text: str) -> str | None:
    if "pro max" in text:
        return "pro max"
    if "plus" in text:
        return "plus"
    if "mini" in text:
        return "mini"
    if re.search(r"\bpro\b", text):
        return "pro"
    if re.search(r"\be\b", text):
        return "e"
    return None


def extract_generation(text: str) -> str | None:
    match = re.search(r"(?:iphone\s*)?(\d{2})", text)
    return match.group(1) if match else None


def extract_capacity(text: str) -> str | None:
    match = re.search(r"\b(128|256|512|1024|2048)\s*(?:gb)?\b", text)
    if match:
        return normalize_capacity(match.group(1))
    match = re.search(r"\b(1|2)\s*tb\b", text)
    if match:
        return normalize_capacity(f"{match.group(1)}tb")
    return None


def item_matches_spec(item: dict, generation: str | None, variant: str | None, capacity: str | None) -> bool:
    model = normalize_text(str(item.get("model") or item.get("product") or ""))
    item_generation = extract_generation(model)
    item_variant = extract_variant(model)
    item_capacity = normalize_capacity(item.get("capacity"))

    if generation and item_generation != generation:
        return False
    if variant:
        if variant == "pro" and item_variant != "pro":
            return False
        if variant != "pro" and item_variant != variant:
            return False
    if capacity and item_capacity != capacity:
        return False
    return True


def parse_bulk_request(message: str) -> list[dict]:
    text = normalize_text(message)
    pattern = re.compile(
        r"(?:iphone\s*)?(\d{2})\s*(pro max|pro|plus|mini|e)?\s*(128|256|512|1024|2048|1tb|2tb)?\s*(?:gb)?\s*[*x×]\s*(\d+)",
        re.I,
    )
    items = []
    for generation, variant, capacity, quantity in pattern.findall(text):
        items.append(
            {
                "generation": generation,
                "variant": (variant or "").strip().lower() or None,
                "capacity": normalize_capacity(capacity),
                "quantity": int(quantity),
            }
        )
    return items


def build_focused_simple_price_data(message: str, full_price_data: list[dict], fallback_price_data: list[dict]) -> list[dict]:
    bulk_items = parse_bulk_request(message)
    if bulk_items:
        grouped: dict[str, list[tuple[str, int]]] = {}
        seen = set()
        for spec in bulk_items:
            for item in full_price_data:
                if item_matches_spec(
                    item,
                    spec.get("generation"),
                    spec.get("variant"),
                    spec.get("capacity"),
                ):
                    key = (
                        item.get("model"),
                        item.get("capacity"),
                        item.get("store"),
                        item.get("price"),
                    )
                    if key in seen:
                        continue
                    seen.add(key)
                    product_label = f"{item.get('model')} {item.get('capacity')}".strip()
                    store_name = item.get("store")
                    price = int(item.get("price") or 0)
                    if product_label and store_name:
                        grouped.setdefault(product_label, [])
                        grouped[product_label].append((store_name, price))
        if grouped:
            data = []
            for product_label, items in grouped.items():
                top5 = sorted(items, key=lambda item: item[1], reverse=True)[:5]
                compact = ",".join(f"{store}:{price}" for store, price in top5)
                data.append(f"{product_label}:[{compact}]")
            return data

    grouped: dict[str, list[tuple[str, int]]] = {}
    for item in fallback_price_data:
        model = item.get("model")
        capacity = item.get("capacity")
        product_label = f"{model} {capacity}".strip() if model else item.get("product")
        store_name = item.get("store")
        price = int(item.get("price") or 0)
        if not product_label or not store_name:
            continue
        grouped.setdefault(product_label, [])
        grouped[product_label].append((store_name, price))
    data = []
    for product_label, items in grouped.items():
        top5 = sorted(items, key=lambda item: item[1], reverse=True)[:5]
        compact = ",".join(f"{store}:{price}" for store, price in top5)
        data.append(f"{product_label}:[{compact}]")
    return data


def build_bulk_total_reply(message: str, full_price_data: list[dict], language: str) -> str | None:
    bulk_items = parse_bulk_request(message)
    if not bulk_items:
        return None

    rows = []
    grand_total = 0
    for spec in bulk_items:
        matches = [
            item for item in full_price_data
            if item_matches_spec(
                item,
                spec.get("generation"),
                spec.get("variant"),
                spec.get("capacity"),
            )
        ]
        if not matches:
            continue
        best = max(matches, key=lambda item: int(item.get("price") or 0))
        quantity = int(spec.get("quantity") or 1)
        unit_price = int(best.get("price") or 0)
        subtotal = unit_price * quantity
        grand_total += subtotal
        product_label = f"{best.get('model')} {best.get('capacity')}".strip()
        rows.append(
            {
                "product": product_label,
                "store": best.get("store"),
                "unit_price": unit_price,
                "quantity": quantity,
                "subtotal": subtotal,
            }
        )

    if not rows:
        return None

    if language == "ja":
        line_items = [
            f"{idx}) {row['product']} / {row['store']} / 単価 {format_jpy(row['unit_price'])} × {row['quantity']} = {format_jpy(row['subtotal'])}"
            for idx, row in enumerate(rows, start=1)
        ]
        note_a = f"今回の合計は上位価格ベースで {format_jpy(grand_total)} です。機種ごとに一番高い店舗を採用しているため、実際に同時出品する前に在庫状況や受付条件の再確認は必要です。"
        note_b = f"もし一括でまとめて売るなら、機種ごとに最適店舗が分かれる可能性があります。高額帯は店ごとの差が広がりやすいので、まとめ売りと分割売却のどちらが有利かも比べる価値があります。"
        return f"1. 合計金額の内訳\n" + "\n".join(line_items) + f"\n合計 = {format_jpy(grand_total)}\n\n2. AIコメント\n{note_a}\n\n3. AIコメント\n{note_b}"

    if language == "zh":
        line_items = [
            f"{idx}) {row['product']} / {row['store']} / 单价 {format_jpy(row['unit_price'])} × {row['quantity']} = {format_jpy(row['subtotal'])}"
            for idx, row in enumerate(rows, start=1)
        ]
        note_a = f"这次合计按当前可见最高报价计算是 {format_jpy(grand_total)}。我这里是按每个机型分别取最高价店铺来算的，所以真正同时出货前，最好再确认一次各店当下是否还收、以及数量限制。"
        note_b = f"如果你准备一批一起卖，要注意最优店铺未必是同一家。高价机型通常店铺差更大，所以“全部给一家”未必比“分开给最高价店”更划算，这个差额值得你再比一次。"
        return f"1. 合计金额明细\n" + "\n".join(line_items) + f"\n合计 = {format_jpy(grand_total)}\n\n2. AI自动内容\n{note_a}\n\n3. AI自动内容\n{note_b}"

    line_items = [
        f"{idx}) {row['product']} / {row['store']} / unit {format_jpy(row['unit_price'])} × {row['quantity']} = {format_jpy(row['subtotal'])}"
        for idx, row in enumerate(rows, start=1)
    ]
    note_a = f"The current visible best-price total is {format_jpy(grand_total)}. This uses the top store for each model separately, so you should still re-check availability and quantity acceptance before selling."
    note_b = f"If you plan to sell the batch together, the best store may differ by model. Premium devices often have wider store spreads, so splitting the batch by best buyer can outperform sending everything to one shop."
    return f"1. Total breakdown\n" + "\n".join(line_items) + f"\nTotal = {format_jpy(grand_total)}\n\n2. AI comment\n{note_a}\n\n3. AI comment\n{note_b}"


def is_catalog_question(message: str) -> bool:
    text = normalize_text(message)
    patterns = [
        r"iphone.*(有什么种类|有哪些种类|有哪些型号|有哪些款|种类|型号)",
        r"iphone.*(種類|型番|モデル|ラインナップ)",
        r"what.*types of iphone",
        r"iphone.*(types|models|lineup)",
    ]
    return any(re.search(pattern, text) for pattern in patterns)


def summarize_catalog(price_data: list[dict], language: str) -> str:
    unique = {}
    for item in price_data:
        model = item.get("model") or item.get("product")
        capacity = item.get("capacity")
        if not model:
            continue
        unique.setdefault(model, set())
        if capacity:
            unique[model].add(str(capacity))

    model_names = sorted(unique.keys())
    preview = []
    for model in model_names[:12]:
        capacities = sorted(unique[model], key=lambda x: int(normalize_capacity(x) or 0))
        if capacities:
            preview.append(f"{model}（{' / '.join(capacities)}）")
        else:
            preview.append(model)

    if language == "ja":
        return "現在データ上で確認できる主な iPhone は、" + "、".join(preview) + " です。気になるモデルがあれば、容量まで指定すると店舗別価格をそのまま出せます。"
    if language == "zh":
        return "当前数据里能识别的主要 iPhone 型号有：" + "、".join(preview) + "。如果你把机型和容量一起告诉我，我可以直接给你各店价格。"
    return "The main iPhone models currently visible in the data are: " + ", ".join(preview) + ". If you specify model and storage, I can return store-by-store pricing."


def build_catalog_context(price_data: list[dict]) -> list[dict]:
    catalog = {}
    for item in price_data:
        model = item.get("model")
        if not model:
            continue
        model_entry = catalog.setdefault(model, {"capacities": set(), "stores": set()})
        if item.get("capacity"):
            model_entry["capacities"].add(str(item.get("capacity")))
        if item.get("store"):
            model_entry["stores"].add(str(item.get("store")))

    rows = []
    for model, data in sorted(catalog.items()):
        rows.append(
            {
                "model": model,
                "capacities": sorted(data["capacities"], key=lambda x: int(normalize_capacity(x) or 0)),
                "store_count": len(data["stores"]),
            }
        )
    return rows


def filter_price_context_for_message(message: str, price_data: list[dict], session_history: list[dict] | None = None) -> list[dict]:
    history_text = " ".join(
        item.get("content", "")
        for item in (session_history or [])
        if item.get("role") == "user" and item.get("content")
    )
    text = normalize_text(f"{history_text} {message}")
    generation = extract_generation(text)
    variant = extract_variant(text)
    capacity = extract_capacity(text)

    if not generation and not variant and not capacity:
        return price_data

    filtered = []
    for item in price_data:
        if item_matches_spec(item, generation, variant, capacity):
            filtered.append(item)

    return filtered or price_data


def sanitize_ai_reply(reply: str) -> str:
    cleaned_lines = []
    for raw_line in reply.splitlines():
        line = re.sub(r"^#{1,6}\s*", "", raw_line)
        line = re.sub(r"\*\*(.*?)\*\*", r"\1", line)
        line = re.sub(r"__(.*?)__", r"\1", line)
        line = line.strip()
        if not line:
            if cleaned_lines and cleaned_lines[-1] != "":
                cleaned_lines.append("")
            continue
        if line.startswith("次の一手"):
            continue
        if "|" in line:
            continue
        if re.fullmatch(r"[-:| ]{3,}", line):
            continue
        cleaned_lines.append(line)

    cleaned = "\n".join(cleaned_lines).strip()
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned


def detect_language(text: str) -> str:
    if re.search(r"[\u3040-\u30ff]", text):
        return "ja"
    if re.search(r"[\u4e00-\u9fff]", text):
        return "zh"
    return "en"


def resolve_response_language(preferred_language: str | None, message: str, conversation_history: list[dict]) -> str:
    if preferred_language in {"zh", "ja", "en"}:
        return preferred_language

    detected = detect_language(message)
    if detected:
        return detected

    for item in reversed(conversation_history):
        content = item.get("content")
        if not content:
            continue
        detected = detect_language(str(content))
        if detected:
            return detected

    return "en"


def format_jpy(value: int) -> str:
    return f"{value:,}円"


def build_market_line(item: dict, language: str) -> str:
    market_average = item.get("market_average")
    market_median = item.get("market_median")
    market_store_count = item.get("market_store_count")
    market_confidence = item.get("market_confidence")
    if not market_average:
        return ""

    average_text = format_jpy(int(market_average))
    median_text = format_jpy(int(market_median or market_average))
    count_text = str(market_store_count or "-")
    confidence_text = str(market_confidence or "-")

    if language == "ja":
        return f"\n市場平均 {average_text} / 中央値 {median_text} / 採用店舗 {count_text} / 信頼度 {confidence_text}"
    if language == "zh":
        return f"\n市场均价 {average_text} / 中位价 {median_text} / 采用店铺 {count_text} / 可信度 {confidence_text}"
    return f"\nMarket average {average_text} / median {median_text} / stores {count_text} / confidence {confidence_text}"


def select_ai_note(message: str, product_name: str, store_name: str, spread: int, language: str, note_group: str) -> str:
    seed_text = f"{message}|{product_name}|{store_name}|{spread}|{datetime.utcnow().isoformat(timespec='microseconds')}"
    seed = sum(ord(ch) for ch in f"{seed_text}|{note_group}")

    if language == "ja":
        notes = (
            [
                f"今日の相場感では、{store_name}が価格面でかなり強く見えます。{product_name}は単価が高い分だけ店舗差も広がりやすく、上位店を押さえるだけで結果が変わりやすい局面です。相場が大きく崩れている感じではないので、条件が合えば早めに動いても不自然ではありません。",
                f"NOVA AI の見立てでは、{product_name}は比較の価値が高い機種です。特に今はトップ帯の店がかなり前に出ており、同じ日に申し込んでも店選びで受取額に差が出やすい状態です。価格だけでなく申込条件も一緒に見ながら決めるのが効率的です。",
                f"今回の価格分布を見ると、{product_name}はまだ高値を維持しています。ただし高値圏のときほど店舗ごとの査定ポリシー差が表面化しやすく、上位店に絞って見比べる意味があります。価格更新が細かい店なら、短時間でも数字が動く可能性はあります。",
            ]
            if note_group == "group_a"
            else [
                f"売却判断としては悪くないタイミングです。{product_name}は上位と下位の差がはっきりしているため、どこに出すかで手残りの印象が変わります。価格だけで即決するより、URL先の条件や減額ルールまで軽く見てから決める方がブレが少なくなります。",
                f"今の見え方なら、{store_name}を軸に比較するのが素直です。{product_name}は需要が残っている一方で、店側の在庫状況によって提示額が揺れやすいタイプでもあります。今日中に結論を出すなら、上位3店だけに絞って確認する進め方で十分です。",
                f"NOVA AI では、今回の{product_name}は『価格差を取りにいく価値がある機種』と見ています。トップ店に寄せていく動きが見える一方、下位店との差も残っているため、単純に近い店へ出すより価格優先で選ぶ方が納得しやすい相場です。",
            ]
        )
        return notes[seed % len(notes)]

    if language == "zh":
        notes = (
            [
                f"从这一轮报价看，{store_name} 在价格端明显更强，说明当前高价回收单正在向头部店铺集中。{product_name} 这种高单价机型，店与店之间的差距通常不会太小，只看一家很容易错过更高价。现在的盘面还不算弱，愿意出手的话不必拖太久。",
                f"NOVA AI 的判断是，{product_name} 目前属于很值得先比价再行动的机型。前几家店的报价已经拉开层次，同一天提交给不同店铺，最终回收金额可能就会出现明显差别。先锁定前 3 家，再看各自条件，会比盲目出手更稳。",
                f"这批数据说明 {product_name} 还在高位区间运行，但高位并不代表所有店都愿意给同样的价。越是这种阶段，头部店和普通店的差别越容易被放大。你如果今天准备卖，优先围绕高价店做比较会更划算。",
            ]
            if note_group == "group_a"
            else [
                f"如果从操作角度看，现在并不是差的卖出窗口。{product_name} 的上位报价仍然有支撑，但后排店铺跟价并不整齐，所以选店比单纯等待更重要。与其把时间放在猜涨跌，不如直接盯住前三家店铺的实际报价和结算条件。",
                f"按当前分布，{store_name} 可以作为第一观察对象，但不建议只看一家。{product_name} 这种机型的回收逻辑，往往是价格、到货判定和减额规则一起决定结果。先把高价店的链接逐个看一遍，通常比反复搜索更有效率。",
                f"NOVA AI 更倾向把这次行情理解成“价格差已足够明显”的阶段。也就是说，你现在真正该抓的不是极限顶部，而是把明显高于平均值的店铺先筛出来。对 {product_name} 来说，这样做比广撒网更容易拿到理想结果。",
            ]
        )
        return notes[seed % len(notes)]

    notes = (
        [
            f"On the current snapshot, {store_name} is clearly leading on price, which usually means top buyers are still willing to compete for this tier. With {product_name}, the store gap is wide enough that checking only one shop would leave money on the table. The market tone is not weak right now, so moving sooner is still a reasonable call.",
            f"NOVA AI would treat {product_name} as a model where comparison matters more than waiting. The top stores are already separating from the rest, and that means the selling outcome can change materially depending on where you apply. Narrowing down to the top three stores is the most efficient move here.",
            f"The current spread suggests {product_name} is still holding a strong resale zone, but not every store is pricing it the same way. In this kind of setup, the upside usually comes from choosing the right buyer rather than chasing a perfect market top. The pricing picture still supports active selling.",
        ]
        if note_group == "group_a"
        else [
            f"From an execution angle, this is still a workable selling window. What stands out is not just the top quote, but how unevenly the rest of the market is following it. For {product_name}, that usually means store selection has more impact than short-term waiting. Checking the top links carefully is the practical move.",
            f"{store_name} can be your anchor quote, but it should not be the only one you look at. Premium-device buyback outcomes often come down to pricing plus condition rules plus intake policy. For {product_name}, comparing just the top three stores can already improve the odds of landing the better result.",
            f"NOVA AI reads this setup as a phase where visible pricing dispersion is already large enough to act on. Instead of trying to predict the exact top, the better play is to isolate the clearly stronger buyers first. That approach tends to work well for {product_name} in the current market snapshot.",
        ]
    )
    return notes[seed % len(notes)]


def build_local_ai_reply(message: str, full_price_data: list[dict], filtered_price_data: list[dict]) -> str:
    language = detect_language(message)

    if not full_price_data:
        if language == "ja":
            return "現在は参照できる価格データがまだありません。少し時間をおいてからもう一度お試しください。"
        if language == "zh":
            return "当前还没有可用的价格数据，稍后再试。"
        return "No price data is available yet. Please try again shortly."

    bulk_reply = build_bulk_total_reply(message, full_price_data, language)
    if bulk_reply:
        return bulk_reply

    if is_catalog_question(message):
        return summarize_catalog(full_price_data, language)

    if not filtered_price_data or filtered_price_data == full_price_data:
        if language == "ja":
            return "いま AI 側の詳細解析が使えないため、機種名と容量をもう少し具体的に入力してください。例えば「iPhone 17 Pro 256GB」や「17 Pro Max 256GB × 6」のように書いていただければ、再度案内しやすくなります。"
        if language == "zh":
            return "当前 AI 详细解析暂时不可用，请把机型和容量写得更具体一点，比如“iPhone 17 Pro 256GB”或“17 Pro Max 256GB * 6”，这样我更容易继续给你结果。"
        return "The full AI analysis is temporarily unavailable. Please specify the model and storage more clearly, for example `iPhone 17 Pro 256GB` or `17 Pro Max 256GB * 6`."

    ranked = sorted(filtered_price_data, key=lambda item: item.get("price") or 0, reverse=True)
    top = ranked[0]
    top_price = int(top.get("price") or 0)
    product_name = top.get("product") or top.get("model") or "iPhone"
    store_name = top.get("store") or "不明"
    spread = top_price - int((ranked[-1].get("price") or top_price))
    top3 = ranked[:3]
    market_line = build_market_line(top, language)
    note_a = select_ai_note(message, product_name, store_name, spread, language, "group_a")
    note_b = select_ai_note(message, product_name, store_name, spread, language, "group_b")

    if language == "ja":
        price_lines = []
        for index, item in enumerate(top3, start=1):
            url = item.get("store_url")
            suffix = f" / {url}" if url else ""
            profit = int(item.get("profit") or 0)
            price_lines.append(f"{index}) {item.get('store')} 価格 {format_jpy(int(item.get('price') or 0))} / 利益 {format_jpy(profit)}{suffix}")
        return (
            f"1. 価格と利益の高い店舗（{product_name}）\n" + "\n".join(price_lines) +
            f"{market_line}\n\n2. AIコメント\n{note_a}\n\n3. AIコメント\n{note_b}"
        )

    if language == "zh":
        price_lines = []
        for index, item in enumerate(top3, start=1):
            url = item.get("store_url")
            suffix = f" / {url}" if url else ""
            profit = int(item.get("profit") or 0)
            price_lines.append(f"{index}) {item.get('store')} 价格 {format_jpy(int(item.get('price') or 0))} / 利润 {format_jpy(profit)}{suffix}")
        return (
            f"1. 价钱店铺（{product_name}）\n" + "\n".join(price_lines) +
            f"{market_line}\n\n2. AI自动内容\n{note_a}\n\n3. AI自动内容\n{note_b}"
        )

    price_lines = []
    for index, item in enumerate(top3, start=1):
        url = item.get("store_url")
        suffix = f" / {url}" if url else ""
        profit = int(item.get("profit") or 0)
        price_lines.append(f"{index}) {item.get('store')} price {format_jpy(int(item.get('price') or 0))} / profit {format_jpy(profit)}{suffix}")
    return (
        f"1. Prices and profit by store ({product_name})\n" + "\n".join(price_lines) +
        f"{market_line}\n\n2. AI comment\n{note_a}\n\n3. AI comment\n{note_b}"
    )


def call_codex_proxy(
    price_text_lines: list[str],
    conversation_history: list[dict],
    user_message: str,
    response_language: str,
) -> str:
    if not settings.codex_proxy_url:
        return ""

    history_lines = []
    for item in conversation_history[-6:]:
        role = item.get("role", "user")
        content = item.get("content", "")
        if content:
            history_lines.append(f"{role}: {content}")

    compact_price_text = "\n".join(price_text_lines) if price_text_lines else "(no price text)"
    language_instruction = {
        "zh": "请用简体中文回答。",
        "ja": "日本語で回答してください。",
        "en": "Please answer in English.",
    }.get(response_language, "Please answer in English.")
    prompt = "\n\n".join([
        "你是 NOVA AI。",
        "你是 ai.novatekku.com 的网页 AI 助手。",
        "主要任务是回答 iPhone 回收价格、店铺比较、NOVA AI 服务介绍和普通用户咨询。",
        "如果用户问价格、机型、容量、店铺、合计金额，必须只根据 PRICE_TEXT 回答。",
        "如果用户问非价格问题，可以正常回答，但不要声称你能浏览网页、查看实时外部信息或访问服务器文件。",
        "如果问题超出 NOVA AI 能力范围，简短说明限制，并把话题引导回 iPhone 回收、店铺比较或 NOVA AI 功能。",
        language_instruction,
        "快速、自然地回复。",
        "不要固定格式，不要表格，不要解释推理过程。",
        "只输出最终回答，通常控制在 120 到 360 字符。",
        "PRICE_TEXT",
        compact_price_text,
        "RECENT_CONVERSATION",
        "\n".join(history_lines) if history_lines else "(none)",
        "USER_QUESTION",
        user_message,
    ])

    def run_codex_prompt(prompt_text: str) -> str:
        response = httpx.post(
            settings.codex_proxy_url,
            json={
                "prompt": prompt_text,
                "model": settings.codex_model,
            },
            timeout=240,
        )
        response.raise_for_status()
        data = response.json()
        return sanitize_ai_reply((data.get("reply") or "").strip())

    return run_codex_prompt(prompt)


def call_openai_chat(system_parts: list[str], conversation_history: list[dict], user_message: str) -> str:
    url = f"{settings.openai_base_url.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "Content-Type": "application/json",
    }
    request_body = {
        "model": settings.openai_model,
        "messages": [
            {
                "role": "system",
                "content": "\n\n".join(system_parts),
            }
        ]
        + conversation_history
        + [{"role": "user", "content": user_message}],
        "max_completion_tokens": 400,
        "temperature": 0.1,
    }

    response = httpx.post(url, headers=headers, json=request_body, timeout=60)
    response.raise_for_status()
    data = response.json()
    message = ((data.get("choices") or [{}])[0] or {}).get("message") or {}
    content = message.get("content", "")
    if isinstance(content, str):
        reply = content.strip()
    elif isinstance(content, list):
        reply = "\n".join(
            block.get("text", "")
            for block in content
            if isinstance(block, dict) and block.get("type") == "text" and block.get("text")
        ).strip()
    else:
        reply = ""
    return sanitize_ai_reply(reply)


@router.post("/ai/chat", response_model=AIChatResponse)
def ai_chat(payload: AIChatRequest, db: Session = Depends(get_db)):
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message is required")

    session_state = get_session_state(payload.session_id)
    if session_state["count"] >= AI_SESSION_MAX:
        raise HTTPException(status_code=429, detail="Daily limit reached")

    conversation_history = session_state.get("history", [])
    response_language = resolve_response_language(payload.language, payload.message.strip(), conversation_history)
    system_prompt = (
        "You are NOVA AI, an iPhone buyback pricing assistant. "
        "Use the provided catalog data and compact simple price text to answer with concrete prices, stores, totals, and product coverage. "
        "Use only the messages in the current session as context. "
        "Do not rely on any memory outside the current session. "
        f"Respond in {response_language}. "
        "Keep the answer direct, natural, and around 300 characters when possible. "
        "Do not use markdown tables unless the user explicitly asks for a table. "
        "Do not output any table-like layout with pipes or columns. "
        "When the user asks for a recommendation, prioritize the store with the highest price in the current data. "
        "By default, use only product, store name, and price unless the user explicitly asks for more fields. "
        "If the user asks for a total across multiple models and quantities, calculate it from the provided price data and show the arithmetic clearly. "
        "If the user asks what iPhone types or models are available, answer from the provided catalog context instead of pretending not to know. "
        "If the user asks about 512GB, 1TB, or 2TB, treat capacity strictly and do not confuse one capacity with another. "
        "If the user asks a follow-up question, use the earlier messages in the current session to resolve omitted model or capacity details. "
        "If the user asks about a product, find the closest matching model and capacity. "
        "If ambiguous, ask a short clarification question. "
        "If the requested model or capacity is not present in the provided price data, do not pretend it is supported. "
        "Instead, politely explain that NOVA is currently in beta and that this model is not supported yet. "
        "Keep that unsupported notice short and natural. "
        "Do not mention that you were given hidden price data. "
        "Respond in the same language as the user."
    )
    full_price_data = build_price_context(db)
    simple_price_data = build_simple_price_context(db)
    catalog_context = build_catalog_context(full_price_data)
    price_data = filter_price_context_for_message(
        payload.message.strip(),
        full_price_data,
        conversation_history,
    )
    focused_simple_price_data = build_focused_simple_price_data(
        payload.message.strip(),
        full_price_data,
        price_data,
    )
    codex_price_text = simple_price_data
    system_parts = [
        system_prompt,
        "CATALOG_CONTEXT (internal only): " + json.dumps(catalog_context, ensure_ascii=False),
        "SIMPLE_PRICE_DATA (internal only): " + json.dumps(simple_price_data, ensure_ascii=False),
        "FOCUSED_SIMPLE_PRICE_DATA (internal only): " + json.dumps(focused_simple_price_data, ensure_ascii=False),
    ]

    reply = ""
    if settings.codex_proxy_url:
        try:
            reply = call_codex_proxy(codex_price_text, conversation_history, payload.message.strip(), response_language)
            logger.info("Codex reply preview: %s", reply[:200])
        except httpx.HTTPStatusError as exc:
            logger.exception("Codex proxy HTTPStatusError: %s", exc.response.text)
            reply = ""
        except httpx.HTTPError as exc:
            logger.exception("Codex proxy HTTPError: %s", str(exc))
            reply = ""
        if not reply:
            if response_language == "ja":
                reply = "現在 Codex AI が一時的に利用できません。少し時間をおいてからもう一度お試しください。"
            elif response_language == "zh":
                reply = "当前 Codex AI 暂时不可用，请稍后再试。"
            else:
                reply = "Codex AI is temporarily unavailable. Please try again shortly."

    if not reply and not settings.codex_proxy_url and settings.openai_api_key:
        try:
            reply = call_openai_chat(system_parts, conversation_history, payload.message.strip())
        except (httpx.HTTPStatusError, httpx.HTTPError):
            reply = ""

    if not reply:
        reply = build_local_ai_reply(payload.message.strip(), full_price_data, price_data)

    session_state["history"] = (
        conversation_history
        + [{"role": "user", "content": payload.message.strip()}]
        + [{"role": "assistant", "content": reply}]
    )[-AI_HISTORY_MAX_MESSAGES:]
    session_state["count"] += 1
    remaining = max(AI_SESSION_MAX - session_state["count"], 0)

    return AIChatResponse(reply=reply, remaining=remaining)
