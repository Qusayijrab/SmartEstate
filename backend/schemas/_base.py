"""Common Pydantic base for request/response models.

All public model fields are declared in snake_case Python and exposed as
camelCase JSON via an alias generator. This avoids the
``UnsupportedFieldAttributeWarning`` that pydantic 2.13+ emits when ``Field(alias=...)``
metadata is unwrapped by FastAPI's per-field ``TypeAdapter``.
"""

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        extra="ignore",
    )
