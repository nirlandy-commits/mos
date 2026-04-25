export function createDefaultLoginForm(email = "") {
  return {
    email,
    password: "",
  };
}

export function createDefaultSignupForm() {
  return {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    weight: "",
    height: "",
    goal: "lose",
    acceptedTerms: false,
  };
}

export function createDefaultResetPasswordForm() {
  return {
    password: "",
    confirmPassword: "",
  };
}
