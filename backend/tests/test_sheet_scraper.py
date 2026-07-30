import csv
import io

from app.services.sheet_scraper import infer_capacity, normalize_model_key, parse_iphone_data, parse_price


def make_csv(rows):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerows(rows)
    return output.getvalue()


def test_parse_price_handles_common_sheet_values():
    assert parse_price("￥226,500 オレンジ -2000") == 226500
    assert parse_price("226500") == 226500
    assert parse_price("要問い合わせ") is None
    assert parse_price("#N/A") is None
    assert parse_price("-") is None


def test_infer_capacity_uses_raw_value_first():
    assert infer_capacity("17 PM", 195000, "512") == "512"
    assert infer_capacity("15PM", 249800, "1024") == "1TB"


def test_infer_capacity_from_apple_price():
    assert infer_capacity("17 PM", 195000, "") == "256"
    assert infer_capacity("17 PM", 225000, "") == "512"
    assert infer_capacity("17 PM", 250000, "") == "1TB"
    assert infer_capacity("17 PM", 320000, "") == "2TB"
    assert infer_capacity("16e", 98000, "") == "128"
    assert infer_capacity("15PM", 249800, "") == "1TB"
    assert infer_capacity("15Plus", 154800, "") == "256"
    assert infer_capacity("14PM", 164800, "") == "128"
    assert infer_capacity("14Plus", 169800, "") == "512"


def test_normalize_model_key_handles_sheet_aliases():
    assert normalize_model_key("16Pro") == "16 Pro"
    assert normalize_model_key("iPhone 15 Pro Max") == "15PM"
    assert normalize_model_key("15Plus") == "15Plus"
    assert normalize_model_key("14PM") == "14PM"


def test_parse_iphone_data_extracts_supported_models_and_store_prices():
    headers = ["Model", "Capacity", "Apple"] + [""] * 29 + ["森森法人買取", "買取商店 リンク"]
    row = ["17 PM", "", "￥195,000"] + [""] * 29 + ["￥226,500 オレンジ -2000", "221000"]
    csv_text = make_csv([headers, row])

    data = parse_iphone_data(csv_text)

    assert data == [
        {
            "model": "17 PM",
            "capacity": "256",
            "apple_price": 195000,
            "store_prices": {
                "森森買取": 226500,
                "買取商店": 221000,
            },
        }
    ]


def test_parse_iphone_data_extracts_iphone_15_and_14_from_same_sheet_format():
    headers = ["Model", "Capacity", "Apple"] + [""] * 29 + ["森森法人買取", "買取商店 リンク"]
    rows = [
        ["15PM", "1024", "￥249,800"] + [""] * 29 + ["￥144,000", "143000"],
        ["15Pro", "256", "￥174,800"] + [""] * 29 + ["￥116,000", ""],
        ["14Plus", "", "￥169,800"] + [""] * 29 + ["", "￥88,000"],
    ]
    csv_text = make_csv([headers, *rows])

    data = parse_iphone_data(csv_text)

    assert data == [
        {
            "model": "15PM",
            "capacity": "1TB",
            "apple_price": 249800,
            "store_prices": {
                "森森買取": 144000,
                "買取商店": 143000,
            },
        },
        {
            "model": "15Pro",
            "capacity": "256",
            "apple_price": 174800,
            "store_prices": {
                "森森買取": 116000,
            },
        },
        {
            "model": "14Plus",
            "capacity": "512",
            "apple_price": 169800,
            "store_prices": {
                "買取商店": 88000,
            },
        },
    ]


def test_parse_iphone_data_skips_unsupported_models_and_empty_capacity():
    headers = ["Model", "Capacity", "Apple"] + [""] * 29 + ["森森法人買取"]
    rows = [
        ["13 Pro", "256", "￥150,000"] + [""] * 29 + ["￥120,000"],
        ["17 PM", "", ""] + [""] * 29 + ["￥226,500"],
    ]
    csv_text = make_csv([headers, *rows])

    assert parse_iphone_data(csv_text) == []
