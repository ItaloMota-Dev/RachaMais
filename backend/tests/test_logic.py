"""
Unit tests for logic.py
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from logic import normalize_currency_text, simplify_debts


# ── normalize_currency_text ──────────────────────────────────────────────────

class TestNormalizeCurrencyText:
    def test_removes_real_symbol(self):
        assert normalize_currency_text("R$ 123,45") == "123.45"

    def test_removes_dollar_symbol(self):
        assert normalize_currency_text("$ 99.99") == "99.99"

    def test_converts_comma_to_period(self):
        assert normalize_currency_text("1234,56") == "1234.56"

    def test_handles_thousands_separator(self):
        result = normalize_currency_text("1.234,56")
        assert result == "1234.56"

    def test_strips_whitespace(self):
        assert normalize_currency_text("  50,00  ") == "50.00"

    def test_plain_period_decimal(self):
        assert normalize_currency_text("R$50.00") == "50.00"

    def test_result_is_convertible_to_float(self):
        raw_values = [
            "R$ 123,45",
            "1.234,56",
            "$ 0,99",
            "  10.00  ",
        ]
        for raw in raw_values:
            normalized = normalize_currency_text(raw)
            assert float(normalized) > 0, f"Could not convert '{raw}' → '{normalized}'"


# ── simplify_debts ────────────────────────────────────────────────────────────

class TestSimplifyDebts:
    def test_empty_balances(self):
        assert simplify_debts({}) == []

    def test_all_zeroes(self):
        assert simplify_debts({1: 0.0, 2: 0.0}) == []

    def test_single_transfer(self):
        # User 1 owes 50 to user 2
        result = simplify_debts({1: -50.0, 2: 50.0})
        assert len(result) == 1
        t = result[0]
        assert t["from_user"] == 1
        assert t["to_user"] == 2
        assert t["amount"] == 50.0

    def test_three_people_two_transfers(self):
        # 1 owes 30, 2 owes 20, 3 is owed 50
        balances = {1: -30.0, 2: -20.0, 3: 50.0}
        result = simplify_debts(balances)
        # Total transferred should equal 50
        total = sum(t["amount"] for t in result)
        assert abs(total - 50.0) < 0.01
        # Should require at most 2 transfers
        assert len(result) <= 2

    def test_balanced_group(self):
        # Net sum is 0 → no transfers needed
        balances = {1: 100.0, 2: -60.0, 3: -40.0}
        result = simplify_debts(balances)
        total_paid = sum(t["amount"] for t in result)
        assert abs(total_paid - 100.0) < 0.01

    def test_minimises_transactions(self):
        # Classic 4-person scenario
        balances = {1: -90.0, 2: 30.0, 3: 30.0, 4: 30.0}
        result = simplify_debts(balances)
        # Greedy should produce at most 3 transfers
        assert len(result) <= 3

    def test_fractional_amounts(self):
        balances = {1: -33.33, 2: 16.67, 3: 16.66}
        result = simplify_debts(balances)
        total = sum(t["amount"] for t in result)
        assert abs(total - 33.33) < 0.05

    def test_large_number_of_people(self):
        # 5 debtors and 5 creditors, each ±100
        balances = {i: -100.0 for i in range(1, 6)}
        balances.update({i: 100.0 for i in range(6, 11)})
        result = simplify_debts(balances)
        # Each transfer should have positive amount
        for t in result:
            assert t["amount"] > 0
        # Total transferred = 500
        total = sum(t["amount"] for t in result)
        assert abs(total - 500.0) < 0.01
