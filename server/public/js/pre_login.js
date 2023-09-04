function changeType(input, type) {
    input.type = type.toString();
};

document.addEventListener('DOMContentLoaded', async () => {
    let loginForm = document.getElementById('login-form');
    let passwordLogin = document.querySelector('input[id*="password-login"]');
    let isTypingLogin = false;

    passwordLogin.addEventListener('focus', async (e) => {
        isTypingLogin = true;
    });

    passwordLogin.addEventListener('blur', async (e) => {
        isTypingLogin = false;
    });

    passwordLogin.addEventListener('mouseover', async (e) => {
        let loginTimeout = setTimeout(() => {
            if (isTypingLogin == false) {
                changeType(passwordLogin, 'text');
                clearTimeout(loginTimeout);
            } else {
                changeType(passwordLogin, 'password');
            };
        }, 200);
    });

    passwordLogin.addEventListener('mouseout', async (e) => {
        changeType(passwordLogin, 'password');
    });

    passwordLogin.addEventListener('touchstart', async (e) => {
        changeType(passwordLogin, 'text');
    });

    passwordLogin.addEventListener('touchend', async (e) => {
        changeType(passwordLogin, 'password');
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        let csrfToken = document.querySelector('input[name="csrf_token"').value;

        let formDataJson = {
            email: document.querySelector('input[name="email"]').value,
            password: document.querySelector('input[name="password"]').value,
            item_input: document.querySelector('input[name="item_input"]').value,
            csrf_token: csrfToken,
        };

        console.log(window.location.pathname);

        await fetch(window.location.pathname.toString(), {
            method: 'POST',
            body: JSON.stringify(formDataJson),
            headers: {
                'X-CSRF-Token': csrfToken,
                'Content-Type': 'application/json',
            },
            keepalive: true,
        }).then((res) => res.text()).then((res) => {
            if (res.toString().toLowerCase().includes('error')) {
                if (typeof JSON.parse(res) === 'object') {
                    document.getElementById('login-error').innerText = JSON.parse(res).message;
                } else {
                    document.getElementById('login-error').innerText = res;
                };
            } else {
                document.open();
                document.write(res);
                document.close();
            };
        })
        .catch((err) => {
            document.getElementById('login-error').innerText = err;
        });
    });
});