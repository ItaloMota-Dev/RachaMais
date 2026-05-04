from typing import Optional, List
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship


# ── Many-to-Many link table ──────────────────────────────────────────────────

class GroupMember(SQLModel, table=True):
    __tablename__ = "group_members"

    group_id: Optional[int] = Field(
        default=None, foreign_key="groups.id", primary_key=True
    )
    user_id: Optional[int] = Field(
        default=None, foreign_key="users.id", primary_key=True
    )


# ── Users ────────────────────────────────────────────────────────────────────

class UserBase(SQLModel):
    name: str
    email: str
    avatar_url: Optional[str] = None
    pix_key: Optional[str] = None


class User(UserBase, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str

    groups: List["Group"] = Relationship(
        back_populates="members", link_model=GroupMember
    )
    expenses_paid: List["Expense"] = Relationship(back_populates="paid_by")
    splits: List["ExpenseSplit"] = Relationship(back_populates="user")


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: int


# ── Groups ───────────────────────────────────────────────────────────────────

class GroupBase(SQLModel):
    name: str
    category_icon: str = "🏠"


class Group(GroupBase, table=True):
    __tablename__ = "groups"

    id: Optional[int] = Field(default=None, primary_key=True)

    members: List[User] = Relationship(
        back_populates="groups", link_model=GroupMember
    )
    expenses: List["Expense"] = Relationship(back_populates="group")


class GroupCreate(GroupBase):
    member_ids: List[int] = []


class GroupRead(GroupBase):
    id: int


# ── Expenses ─────────────────────────────────────────────────────────────────

class ExpenseBase(SQLModel):
    description: str
    amount: float
    date: datetime = Field(default_factory=datetime.utcnow)


class Expense(ExpenseBase, table=True):
    __tablename__ = "expenses"

    id: Optional[int] = Field(default=None, primary_key=True)
    group_id: int = Field(foreign_key="groups.id")
    paid_by_id: int = Field(foreign_key="users.id")

    group: Optional[Group] = Relationship(back_populates="expenses")
    paid_by: Optional[User] = Relationship(back_populates="expenses_paid")
    splits: List["ExpenseSplit"] = Relationship(back_populates="expense")


class ExpenseCreate(ExpenseBase):
    group_id: int
    paid_by_id: int
    splits: List["ExpenseSplitCreate"] = []


class ExpenseRead(ExpenseBase):
    id: int
    group_id: int
    paid_by_id: int


# ── ExpenseSplit ─────────────────────────────────────────────────────────────

class ExpenseSplitBase(SQLModel):
    value: float


class ExpenseSplit(ExpenseSplitBase, table=True):
    __tablename__ = "expense_splits"

    id: Optional[int] = Field(default=None, primary_key=True)
    expense_id: int = Field(foreign_key="expenses.id")
    user_id: int = Field(foreign_key="users.id")

    expense: Optional[Expense] = Relationship(back_populates="splits")
    user: Optional[User] = Relationship(back_populates="splits")


class ExpenseSplitCreate(ExpenseSplitBase):
    user_id: int


class ExpenseSplitRead(ExpenseSplitBase):
    id: int
    expense_id: int
    user_id: int


# ── Settlements ──────────────────────────────────────────────────────────────

class SettlementBase(SQLModel):
    amount: float
    status: str = "pending"


class Settlement(SettlementBase, table=True):
    __tablename__ = "settlements"

    id: Optional[int] = Field(default=None, primary_key=True)
    from_user: int = Field(foreign_key="users.id")
    to_user: int = Field(foreign_key="users.id")


class SettlementCreate(SettlementBase):
    from_user: int
    to_user: int


class SettlementRead(SettlementBase):
    id: int
    from_user: int
    to_user: int


# Resolve forward references
ExpenseCreate.model_rebuild()
