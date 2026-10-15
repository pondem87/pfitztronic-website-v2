(function () {
    "use strict";

    var endpoint = document.documentElement.dataset.contactFormEndpoint;
    var country = (document.documentElement.dataset.siteCountry || "").toUpperCase();

    function escapeHtml(value) {
        return value.replace(/[&<>'"]/g, function (character) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "'": "&#39;",
                "\"": "&quot;"
            }[character];
        });
    }

    function buildPayload(form) {
        var formData = new FormData(form);
        var name = formData.get("name").trim();
        var email = formData.get("email").trim();
        var subject = formData.get("subject").trim();
        var message = formData.get("message").trim();
        var mobile = (formData.get("mobile") || "").trim();

        return {
            name: name,
            email: email,
            subject: subject,
            text: [
                "New website contact enquiry",
                "Country: " + country,
                "",
                "Name: " + name,
                "Email: " + email,
                "Mobile: " + mobile,
                "Subject: " + subject,
                "",
                "Message:",
                message
            ].join("\n"),
            html: [
                "<h2>New website contact enquiry</h2>",
                "<p><strong>Country:</strong> " + escapeHtml(country) + "</p>",
                "<p><strong>Name:</strong> " + escapeHtml(name) + "</p>",
                "<p><strong>Email:</strong> " + escapeHtml(email) + "</p>",
                "<p><strong>Mobile:</strong> " + escapeHtml(mobile) + "</p>",
                "<p><strong>Subject:</strong> " + escapeHtml(subject) + "</p>",
                "<p><strong>Message:</strong></p>",
                "<p>" + escapeHtml(message).replace(/\r?\n/g, "<br>") + "</p>"
            ].join("")
        };
    }

    document.querySelectorAll(".js-contact-form").forEach(function (form) {
        var button = form.querySelector('button[type="submit"]');
        var fieldset = form.querySelector('fieldset');
        var status = form.querySelector(".js-contact-status");
        var buttonLabel = button.querySelector('span');
        var spinner = button.querySelector('.spinner-border');
        var sending = false;
        var originalButtonText = buttonLabel.textContent;
        var configured = false;
        try {
            configured = new URL(endpoint).protocol === 'https:' && ['BW', 'ZW'].includes(country);
        } catch (_) { /* Leave email fallback available if configuration is missing. */ }
        button.disabled = !configured;
        if (!configured) status.textContent = "Please use the email link below to send your enquiry.";

        form.addEventListener('input', function (event) {
            if (event.target.setCustomValidity) event.target.setCustomValidity('');
        });

        form.addEventListener("submit", async function (event) {
            event.preventDefault();
            if (sending || !configured) return;

            ['name', 'email', 'mobile', 'subject', 'message'].forEach(function (name) {
                var field = form.elements.namedItem(name);
                field.value = field.value.trim();
                field.setCustomValidity(field.value ? '' : 'Please complete this field.');
            });
            var mobile = form.elements.namedItem('mobile');
            var digits = mobile.value.replace(/[^0-9]/g, '');
            if (mobile.value && (!/^\+?[0-9 () .-]+$/.test(mobile.value) || digits.length < 7 || digits.length > 15)) {
                mobile.setCustomValidity('Enter a phone number with 7 to 15 digits, including your country code.');
            }
            if (!form.reportValidity()) return;

            // Collect values before disabling the fieldset: disabled fields are absent from FormData.
            var payload = buildPayload(form);
            var controller = new AbortController();
            var timeout = setTimeout(function () { controller.abort(); }, 30000);
            sending = true;
            fieldset.disabled = true;
            button.disabled = true;
            form.setAttribute('aria-busy', 'true');
            buttonLabel.textContent = "Sending...";
            spinner.classList.remove('d-none');
            status.className = "js-contact-status mt-3 mb-0";
            status.textContent = "Sending your message...";

            try {
                var response = await fetch(endpoint, {
                    method: "POST",
                    mode: "cors",
                    credentials: "omit",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });
                if (!response.ok) {
                    var serviceError = new Error('Mail service rejected the request');
                    serviceError.status = response.status;
                    throw serviceError;
                }
                // The existing DigitalOcean handler returns Nodemailer's JSON info as text/plain.
                var receipt = JSON.parse(await response.text());
                if (!receipt || typeof receipt.messageId !== 'string' || !receipt.messageId.trim()) {
                    throw new Error('No mail receipt returned');
                }
                form.reset();
                status.className = "js-contact-status alert alert-success mt-3 mb-0";
                status.textContent = "Thank you. Your enquiry has been submitted successfully.";
            } catch (error) {
                status.className = "js-contact-status alert alert-danger mt-3 mb-0";
                if (error.status === 429) {
                    status.textContent = "Too many requests. Please wait before trying again, or email us directly.";
                } else if (error.status) {
                    status.textContent = "We could not send your message. Your entries have been kept. Please try again or email us directly.";
                } else {
                    // A timeout or lost response does not prove that the server failed to send.
                    status.textContent = "We could not confirm whether your message was sent. Your entries have been kept. Please email us if you need confirmation.";
                }
            } finally {
                clearTimeout(timeout);
                sending = false;
                fieldset.disabled = false;
                button.disabled = false;
                form.removeAttribute('aria-busy');
                buttonLabel.textContent = originalButtonText;
                spinner.classList.add('d-none');
            }
        });
    });
})();
