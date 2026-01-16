export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateEmail(email: string): string | null {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Invalid email format';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value || !value.trim()) return `${fieldName} is required`;
  return null;
}

export function validateLoginForm(email: string, password: string): ValidationResult {
  const errors: Record<string, string> = {};
  
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  
  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateRegisterForm(
  email: string,
  password: string,
  confirmPassword: string,
  role: string
): ValidationResult {
  const errors: Record<string, string> = {};
  
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  
  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;
  
  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  if (!role) errors.role = 'Please select a role';
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateJobForm(data: {
  title: string;
  company: string;
  location: string;
  description: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  
  const titleError = validateRequired(data.title, 'Title');
  if (titleError) errors.title = titleError;
  
  const companyError = validateRequired(data.company, 'Company');
  if (companyError) errors.company = companyError;
  
  const locationError = validateRequired(data.location, 'Location');
  if (locationError) errors.location = locationError;
  
  const descriptionError = validateRequired(data.description, 'Description');
  if (descriptionError) errors.description = descriptionError;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateApplicationForm(data: {
  resumeText: string;
  coverLetter: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  
  const resumeError = validateRequired(data.resumeText, 'Resume');
  if (resumeError) errors.resumeText = resumeError;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
