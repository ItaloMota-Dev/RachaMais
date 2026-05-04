"""
logic.py – Financial intelligence helpers for Racha+.
"""

import heapq
import re
from typing import Dict, List


# ── Currency normalisation ────────────────────────────────────────────────────

def normalize_currency_text(text: str) -> str:
    """Prepare a raw currency string for float() conversion.

    Steps:
    1. Remove currency symbols (R$, $, €, £).
    2. Strip surrounding whitespace.
    3. Remove thousands-separator dots when a comma follows (e.g. 1.234,56 → 1234.56).
    4. Convert comma decimal separator to period.
    """
    # Remove currency symbols
    text = re.sub(r"[R$€£\$]", "", text)
    # Remove surrounding whitespace
    text = text.strip()
    # Handle Brazilian number format: 1.234,56 → 1234.56
    # Remove dots used as thousands separators (only when followed by digits and a comma)
    text = re.sub(r"\.(?=\d{3},)", "", text)
    # Convert comma decimal separator to period
    text = text.replace(",", ".")
    # Remove any remaining whitespace inside the number
    text = re.sub(r"\s+", "", text)
    return text


# ── Debt simplification (Greedy + Heaps) ─────────────────────────────────────

def simplify_debts(balances: Dict[int, float]) -> List[Dict]:
    """Reduce a balance map to the minimum number of transfers.

    Args:
        balances: mapping of user_id → net balance.
                  Positive  = the user is owed money (creditor).
                  Negative  = the user owes money  (debtor).

    Returns:
        List of dicts: [{"from_user": id, "to_user": id, "amount": float}, ...]
    """
    # Round to avoid floating-point noise
    balances = {uid: round(bal, 2) for uid, bal in balances.items()}

    # min-heap for debtors  (amount, user_id)  – smallest (most negative) first
    debtors: List = []
    # max-heap for creditors (negated amount, user_id) – largest first via negation
    creditors: List = []

    for uid, bal in balances.items():
        if bal < -0.001:
            heapq.heappush(debtors, (bal, uid))       # negative value, smallest first
        elif bal > 0.001:
            heapq.heappush(creditors, (-bal, uid))    # negated so largest pops first

    settlements: List[Dict] = []

    while debtors and creditors:
        debt_amount, debtor_id = heapq.heappop(debtors)       # most negative balance
        credit_neg, creditor_id = heapq.heappop(creditors)    # most positive (negated)
        credit_amount = -credit_neg

        transfer = min(-debt_amount, credit_amount)
        transfer = round(transfer, 2)

        settlements.append(
            {"from_user": debtor_id, "to_user": creditor_id, "amount": transfer}
        )

        remaining_debt = round(debt_amount + transfer, 2)
        remaining_credit = round(credit_amount - transfer, 2)

        if remaining_debt < -0.001:
            heapq.heappush(debtors, (remaining_debt, debtor_id))
        if remaining_credit > 0.001:
            heapq.heappush(creditors, (-remaining_credit, creditor_id))

    return settlements


# ── Group balance calculation ─────────────────────────────────────────────────

def calculate_group_balances(
    group_id: int,
    session=None,  # sqlmodel Session – injected at call site to avoid circular imports
) -> Dict[int, float]:
    """Compute net balance for every member of *group_id*.

    A positive balance means the user is owed that amount.
    A negative balance means the user owes that amount.
    """
    from sqlmodel import select
    from models import Expense, ExpenseSplit

    if session is None:
        raise ValueError("A database session must be provided.")

    balances: Dict[int, float] = {}

    expenses = session.exec(
        select(Expense).where(Expense.group_id == group_id)
    ).all()

    for expense in expenses:
        payer = expense.paid_by_id
        balances[payer] = balances.get(payer, 0.0) + expense.amount

        splits = session.exec(
            select(ExpenseSplit).where(ExpenseSplit.expense_id == expense.id)
        ).all()

        for split in splits:
            uid = split.user_id
            balances[uid] = balances.get(uid, 0.0) - split.value

    return {uid: round(bal, 2) for uid, bal in balances.items()}
