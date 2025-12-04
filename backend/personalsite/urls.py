# backend/personalsite/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from django.views.generic import TemplateView

# --- NEW IMPORTS FOR MEDIA FILES ---
from django.conf import settings
from django.conf.urls.static import static
# --- END NEW IMPORTS ---
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/', include('users.urls')),

    path('api/documents/', include('document_store.urls')),
    # This will include /api/documents/documents/ and /api/documents/categories/

    path('api/photos/', include('photo_store.urls')), # This will include /api/photos/galleries/ and /api/photos/images/

    path('backend/', include('backend.urls')),
    path('', TemplateView.as_view(template_name='index.html')),
]

# --- CRITICAL: SERVE MEDIA FILES ONLY IN DEVELOPMENT (DEBUG=True) ---
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
# --- END CRITICAL ---
