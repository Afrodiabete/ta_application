from django import forms
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from src.models import Users

class LoginForm(forms.Form):
    email = forms.EmailField(
        max_length=254,
        widget=forms.EmailInput(attrs={'placeholder': 'Email'})
    )
    password = forms.CharField(
        max_length=128,
        widget=forms.PasswordInput(attrs={'placeholder': 'Password'})
    )

    def clean(self):
        cleaned_data = super().clean()
        email = cleaned_data.get('email')
        password = cleaned_data.get('password')

        if email and password:
            user = authenticate(username=email, password=password)
            if user is None:
                raise ValidationError('Invalid email or password')
            cleaned_data['user'] = user

        return cleaned_data

class PasswordResetRequestForm(forms.Form):
    email = forms.EmailField(
        max_length=254,
        required=True,
        widget=forms.EmailInput(attrs={'placeholder': 'Email'})
    )

    def clean(self):
        cleaned_data = super().clean()
        email = cleaned_data.get('email')

        if not email:
            return cleaned_data

        try:
            user = Users.objects.get(email__iexact=email)
            cleaned_data['user'] = user
        except Users.DoesNotExist:
            raise ValidationError('No user found with the provided email')
        except Users.MultipleObjectsReturned:
            raise ValidationError('Multiple users found with the provided email. Please contact support.')

        return cleaned_data

class PasswordResetCodeForm(forms.Form):
    verification_code = forms.CharField(
        max_length=6,
        min_length=6,
        required=True,
        widget=forms.TextInput(attrs={'placeholder': 'Verification Code'})
    )

    def clean_verification_code(self):
        code = self.cleaned_data.get('verification_code', '')
        if not code.isdigit():
            raise ValidationError('Verification code must be 6 digits')
        return code

class PasswordResetForm(forms.Form):
    new_password = forms.CharField(
        max_length=128,
        required=True,
        widget=forms.PasswordInput(attrs={'placeholder': 'New Password'})
    )
    confirm_password = forms.CharField(
        max_length=128,
        required=True,
        widget=forms.PasswordInput(attrs={'placeholder': 'Confirm Password'})
    )

    def clean(self):
        cleaned_data = super().clean()
        new_password = cleaned_data.get('new_password')
        confirm_password = cleaned_data.get('confirm_password')


class RegistrationForm(forms.ModelForm):
    password = forms.CharField(
        max_length=128,
        widget=forms.PasswordInput(attrs={'placeholder': 'Password'}),
        required=True
    )
    confirm_password = forms.CharField(
        max_length=128,
        widget=forms.PasswordInput(attrs={'placeholder': 'Confirm Password'}),
        required=True
    )

    class Meta:
        model = Users
        fields = ['first_name', 'last_name', 'email', 'password']
        widgets = {
            'first_name': forms.TextInput(attrs={'placeholder': 'First Name'}),
            'last_name': forms.TextInput(attrs={'placeholder': 'Last Name'}),
            'email': forms.EmailInput(attrs={'placeholder': 'Email'}),
        }

    def clean(self):
        cleaned_data = super().clean()
        password = cleaned_data.get("password")
        confirm_password = cleaned_data.get("confirm_password")

        if password and confirm_password and password != confirm_password:
            raise ValidationError("Passwords do not match.")
        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        user.username = user.email
        user.set_password(self.cleaned_data["password"])
        # Inherit default behavior (is_active=True, is_staff=False, is_superuser=False)
        if commit:
            user.save()
        return user

