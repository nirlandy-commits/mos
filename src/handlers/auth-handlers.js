export function createAuthHandlers(deps) {
  const {
    authConfigured,
    signupForm,
    loginForm,
    recoverEmail,
    resetPasswordForm,
    calculateSuggestedCalories,
    getGoalMeta,
    showAuthNotice,
    setAuthBusy,
    signUpWithEmail,
    signInWithEmail,
    sendRecoverEmail,
    updatePassword,
    mutate,
    resetAuthForms,
    setLoginForm,
    setScreen,
    getCurrentAuthState,
    setHasVerifiedSession,
    applyHydratedAuthState,
    clearAuthNotice,
    openSignedInApp,
    getSupabaseSetupMessage,
    setRecoverEmail,
    setPasswordRecoveryReady,
    recoveryFlowRef,
    setResetPasswordForm,
    createDefaultLoginForm,
    createDefaultResetPasswordForm,
  } = deps;

  async function handleSignupSubmit(event) {
    event.preventDefault();
    const name = signupForm.name.trim();
    const email = signupForm.email.trim().toLowerCase();
    const password = signupForm.password;
    const confirmPassword = signupForm.confirmPassword;
    const age = Number(signupForm.age) || 0;
    const weight = Number(signupForm.weight) || 0;
    const height = Number(signupForm.height) || 0;
    const goal = signupForm.goal || "lose";
    const calorieTarget = calculateSuggestedCalories({ weight, height, age, goal });
    const goalMeta = getGoalMeta(goal);

    if (!name || !email || !password || !confirmPassword || !signupForm.acceptedTerms || !age || !weight || !height) {
      showAuthNotice("Preencha todos os campos obrigatórios para concluir o cadastro.");
      return;
    }
    if (password.length < 6) {
      showAuthNotice("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      showAuthNotice("As senhas precisam ser iguais para concluir o cadastro.");
      return;
    }

    if (!authConfigured) {
      showAuthNotice(getSupabaseSetupMessage(), {
        tone: "error",
        title: "Autenticação indisponível",
      });
      return;
    }

    setAuthBusy(true);
    const result = await signUpWithEmail({
      name,
      email,
      password,
      age,
      weight,
      height,
      calorieTarget,
      goal: goalMeta.label,
      planFocus: goalMeta.focus,
    });
    setAuthBusy(false);

    if (!result.ok) {
      if (result.duplicateAccount) {
        setLoginForm(createDefaultLoginForm(email));
        showAuthNotice(
          "Já existe uma conta cadastrada com este e-mail. Se você já criou a conta antes, tente entrar ou redefinir sua senha.",
          { tone: "info", title: "Conta já cadastrada" },
        );
        return;
      }
      showAuthNotice(result.error?.message || "Não foi possível criar sua conta agora.");
      return;
    }

    mutate((draft) => {
      draft.auth = {
        registered: true,
        signedIn: Boolean(result.session),
        email,
        password: "",
      };
      draft.profile.name = name;
      draft.profile.email = email;
      draft.profile.age = age;
      draft.profile.weight = weight;
      draft.profile.height = height;
      draft.profile.targetWeight = goal === "lose" ? Math.max(0, weight - 5) : goal === "gain" ? weight + 3 : weight;
      draft.profile.calorieTarget = calorieTarget || draft.profile.calorieTarget;
      draft.profile.activeGoal = goalMeta.label;
      draft.profile.planFocus = goalMeta.focus;
    });

    resetAuthForms({ email });

    if (result.needsEmailConfirmation) {
      showAuthNotice(
        `Enviamos um link de confirmação para ${email}. Abra seu e-mail e confirme a conta antes de entrar no MOS! Se não encontrar a mensagem, verifique a pasta de spam ou promoções.`,
        { tone: "info", title: "Confirme seu e-mail" },
      );
      setScreen("login");
      return;
    }

    const hydrated = await getCurrentAuthState();
    if (hydrated.session && hydrated.user) {
      setHasVerifiedSession(true);
      applyHydratedAuthState(hydrated, email);
    }
    clearAuthNotice();
    openSignedInApp("home", { replace: true });
  }

  async function handleLoginSubmit() {
    const email = loginForm.email.trim().toLowerCase();
    const password = loginForm.password;
    if (!email || !password) return;

    if (!authConfigured) {
      showAuthNotice(getSupabaseSetupMessage(), {
        tone: "error",
        title: "Autenticação indisponível",
      });
      return;
    }

    setAuthBusy(true);
    const result = await signInWithEmail({ email, password });
    setAuthBusy(false);

    if (!result.ok) {
      showAuthNotice(result.error?.message || "Não foi possível entrar agora.");
      return;
    }

    const hydrated = await getCurrentAuthState();
    if (hydrated.session && hydrated.user) {
      setHasVerifiedSession(true);
      applyHydratedAuthState(hydrated, email);
    } else {
      mutate((draft) => {
        draft.auth = {
          ...draft.auth,
          registered: true,
          email,
          password: "",
          signedIn: true,
        };
        draft.profile.name = result.profile?.name || draft.profile.name;
        draft.profile.email = result.profile?.email || email;
        draft.profile.city = result.profile?.city || draft.profile.city;
        draft.profile.birthday = result.profile?.birth_date || draft.profile.birthday;
      });
    }

    clearAuthNotice();
    openSignedInApp("home", { replace: true });
  }

  async function handleRecoverSubmit(event) {
    event.preventDefault();
    if (!recoverEmail.trim()) return;

    const email = recoverEmail.trim().toLowerCase();
    if (authConfigured) {
      setAuthBusy(true);
      const result = await sendRecoverEmail(email);
      setAuthBusy(false);
      if (!result.ok) {
        showAuthNotice(result.error?.message || "Não foi possível enviar o link agora.");
        return;
      }
      showAuthNotice(
        "Se existir uma conta com esse e-mail, enviaremos um link para redefinir a senha. Verifique sua caixa de entrada, spam e promoções.",
        { tone: "info", title: "Verifique seu e-mail" },
      );
    } else {
      showAuthNotice(getSupabaseSetupMessage(), {
        tone: "error",
        title: "Autenticação indisponível",
      });
    }

    setScreen("login");
    setLoginForm(createDefaultLoginForm(email));
    setRecoverEmail("");
  }

  async function handleResetPasswordSubmit(event) {
    event.preventDefault();
    const password = resetPasswordForm.password;
    const confirmPassword = resetPasswordForm.confirmPassword;

    if (!password || !confirmPassword) return;
    if (password.length < 6) {
      showAuthNotice("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      showAuthNotice("As senhas precisam ser iguais para continuar.");
      return;
    }

    if (!authConfigured) {
      showAuthNotice(getSupabaseSetupMessage(), {
        tone: "error",
        title: "Autenticação indisponível",
      });
      return;
    }

    setAuthBusy(true);
    const result = await updatePassword(password);
    setAuthBusy(false);

    if (!result.ok) {
      showAuthNotice(result.error?.message || "Não foi possível redefinir a senha agora.");
      return;
    }

    recoveryFlowRef.current = false;
    setPasswordRecoveryReady(false);
    if (globalThis.history?.replaceState) {
      globalThis.history.replaceState(null, "", globalThis.location?.pathname || "/");
    }
    setResetPasswordForm(createDefaultResetPasswordForm());
    setLoginForm((current) => createDefaultLoginForm(current.email));
    showAuthNotice("Sua senha foi atualizada com sucesso. Agora você já pode entrar com a nova senha.", {
      tone: "success",
      title: "Senha redefinida",
    });
    setScreen("login");
  }

  return {
    handleSignupSubmit,
    handleLoginSubmit,
    handleRecoverSubmit,
    handleResetPasswordSubmit,
  };
}
