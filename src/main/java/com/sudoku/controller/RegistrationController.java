package com.sudoku.controller;

import com.sudoku.user.RegistrationService;
import com.sudoku.user.SignupForm;
import jakarta.validation.Valid;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
public class RegistrationController {

    private final RegistrationService registrationService;

    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @GetMapping("/signup")
    public String signup(Model model) {
        if (!model.containsAttribute("signupForm")) {
            model.addAttribute("signupForm", new SignupForm());
        }
        return "signup";
    }

    @PostMapping("/signup")
    public String doSignup(
            @Valid @ModelAttribute("signupForm") SignupForm form,
            BindingResult binding,
            Model model
    ) {
        if (!form.getPassword().equals(form.getConfirmPassword())) {
            binding.rejectValue("confirmPassword", "password.mismatch", "Passwords do not match");
        }

        if (binding.hasErrors()) {
            return "signup";
        }

        try {
            registrationService.registerUser(form.getUsername().trim(), form.getPassword());
        } catch (IllegalArgumentException ex) {
            model.addAttribute("signupError", ex.getMessage());
            return "signup";
        }

        return "redirect:/login?registered";
    }
}
