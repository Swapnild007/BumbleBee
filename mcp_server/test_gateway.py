import unittest

from gateway import ALLOWED_TOOLS, host_allowed, origin_allowed, validate_call_payload


class GatewayValidationTests(unittest.TestCase):
    def test_only_local_development_origins_are_allowed(self):
        self.assertTrue(origin_allowed("http://localhost:8080"))
        self.assertTrue(origin_allowed("http://127.0.0.1:8000"))
        self.assertFalse(origin_allowed("https://example.com"))
        self.assertFalse(origin_allowed("null"))

    def test_only_expected_loopback_host_is_allowed(self):
        self.assertTrue(host_allowed("127.0.0.1:8765"))
        self.assertTrue(host_allowed("localhost:8765"))
        self.assertFalse(host_allowed("example.com:8765"))
        self.assertFalse(host_allowed("127.0.0.1.evil:8765"))

    def test_calculator_payload_is_validated(self):
        name, args = validate_call_payload({
            "name": "jarvis_calculate_total",
            "arguments": {"price": 12.5, "quantity": 4},
        })
        self.assertEqual(name, "jarvis_calculate_total")
        self.assertEqual(args, {"price": 12.5, "quantity": 4})

    def test_unknown_tool_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "not enabled"):
            validate_call_payload({"name": "delete_everything", "arguments": {}})

    def test_calculator_rejects_extra_arguments(self):
        with self.assertRaisesRegex(ValueError, "exactly price and quantity"):
            validate_call_payload({
                "name": "jarvis_calculate_total",
                "arguments": {"price": 10, "quantity": 2, "path": "/"},
            })

    def test_calculator_rejects_boolean_price(self):
        with self.assertRaisesRegex(ValueError, "Price must be a number"):
            validate_call_payload({
                "name": "jarvis_calculate_total",
                "arguments": {"price": True, "quantity": 2},
            })

    def test_calculator_rejects_fractional_quantity(self):
        with self.assertRaisesRegex(ValueError, "whole number"):
            validate_call_payload({
                "name": "jarvis_calculate_total",
                "arguments": {"price": 10, "quantity": 2.5},
            })

    def test_calculator_rejects_out_of_range_values(self):
        for args in (
            {"price": -1, "quantity": 1},
            {"price": 10, "quantity": -1},
            {"price": 1_000_000_001, "quantity": 1},
            {"price": 10, "quantity": 1_000_001},
        ):
            with self.subTest(args=args), self.assertRaises(ValueError):
                validate_call_payload({"name": "jarvis_calculate_total", "arguments": args})

    def test_explainer_accepts_no_arguments_only(self):
        name, args = validate_call_payload({"name": "explain_mcp_basics", "arguments": {}})
        self.assertEqual(name, "explain_mcp_basics")
        self.assertEqual(args, {})
        with self.assertRaisesRegex(ValueError, "takes no arguments"):
            validate_call_payload({"name": "explain_mcp_basics", "arguments": {"anything": True}})

    def test_allowlist_contains_only_learning_tools(self):
        self.assertEqual(ALLOWED_TOOLS, {"jarvis_calculate_total", "explain_mcp_basics"})


if __name__ == "__main__":
    unittest.main()
