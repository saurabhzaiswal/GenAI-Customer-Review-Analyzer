from __future__ import annotations

from typing import Generic, TypeVar

from pydantic import ConfigDict
from pydantic.generics import GenericModel

DataT = TypeVar("DataT")


class ApiResponse(GenericModel, Generic[DataT]):
    model_config = ConfigDict(from_attributes=True)
    success: bool = True
    message: str = "Success"
    data: DataT | None = None
