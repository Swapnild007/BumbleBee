"""Run with: python -m unittest discover -s mcp_server -p 'test_*.py'"""
import unittest

from calculator import calculate_total


class CalculatorTests(unittest.TestCase):
    def test_normal_total(self):
        self.assertEqual(
            calculate_total(250, 4),
            {"price": "250", "quantity": 4, "total": "1000.00", "currency": "INR"},
        )

    def test_decimal_total(self):
        self.assertEqual(calculate_total("19.99", 3)["total"], "59.97")

    def test_zero_values(self):
        self.assertEqual(calculate_total(0, 0)["total"], "0.00")

    def test_rejects_negative_price(self):
        with self.assertRaises(ValueError):
            calculate_total(-1, 1)

    def test_rejects_negative_quantity(self):
        with self.assertRaises(ValueError):
            calculate_total(1, -1)

    def test_rejects_fractional_quantity(self):
        with self.assertRaises(ValueError):
            calculate_total(10, 1.5)

    def test_rejects_non_finite_price(self):
        with self.assertRaises(ValueError):
            calculate_total("NaN", 1)

    def test_rejects_excessive_quantity(self):
        with self.assertRaises(ValueError):
            calculate_total(1, 1_000_001)


if __name__ == "__main__":
    unittest.main()
