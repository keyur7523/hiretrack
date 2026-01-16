from fastapi import APIRouter

from routers.auth import router as auth_router
from routers.jobs import router as jobs_router
from routers.applications import router as applications_router
from routers.employer import router as employer_router
from routers.admin import router as admin_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(jobs_router)
router.include_router(applications_router)
router.include_router(employer_router)
router.include_router(admin_router)
