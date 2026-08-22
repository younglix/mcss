from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, password=None, **extra_fields):
        if not extra_fields.get("email") and not extra_fields.get("identifier") and not extra_fields.get("phone"):
            raise ValueError("A user needs at least one of email, phone, or identifier.")
        email = extra_fields.pop("email", None)
        if email:
            email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superadmin", False)
        return self._create_user(password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superadmin", True)
        extra_fields.setdefault("user_type", "staff")
        extra_fields.setdefault("full_name", "Super Admin")

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superadmin") is not True:
            raise ValueError("Superuser must have is_superadmin=True.")

        return self._create_user(password, email=email, **extra_fields)
