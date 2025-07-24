

from typing import Annotated

from fastapi import Depends

from app.auth.middleware import get_authorized_user, User


AuthorizedUser = Annotated[User, Depends(get_authorized_user)]
