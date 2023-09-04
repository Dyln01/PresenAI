function changeType(input, type) {
    input.type = type.toString();
};

document.addEventListener('DOMContentLoaded', async () => {

    let loginForm = document.getElementById('login-form');
    let registerForm = document.getElementById('register-form');
    let passwordLogin =  document.querySelector('input[id*="password-login"]');
    let passwordRegister = document.querySelector('input[id*="password-register"]');
    let repeatPasswordRegister = document.querySelector('input[id*="repeat-password-register"]');
    let isTypingLogin = false;
    let isTypingRegister = false;
    let isTypingRepeatRegister = false;

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


    passwordRegister.addEventListener('focus', async (e) => {
        isTypingRegister = true;
    });

    passwordRegister.addEventListener('blur', async (e) => {
        isTypingRegister = false;
    });

    passwordRegister.addEventListener('mouseover', async (e) => {
        let registerTimeout = setTimeout(() => {
            if (isTypingRegister == false) {
                changeType(passwordRegister, 'text');
                clearTimeout(registerTimeout);
            } else {
                changeType(passwordRegister, 'password');
            };
        }, 200);
    });

    passwordRegister.addEventListener('mouseout', async (e) => {
        changeType(passwordRegister, 'password');
    });

    passwordRegister.addEventListener('touchstart', async (e) => {
        changeType(passwordRegister, 'text');
    });

    passwordRegister.addEventListener('touchend', async (e) => {
        changeType(passwordRegister, 'password');
    });


    repeatPasswordRegister.addEventListener('focus', async (e) => {
        isTypingRepeatRegister = true;
    });

    repeatPasswordRegister.addEventListener('blur', async (e) => {
        isTypingRepeatRegister = false;
    });

    repeatPasswordRegister.addEventListener('mouseover', async (e) => {
        let repeatRegisterTimeout = setTimeout(() => {
            if (isTypingRepeatRegister == false) {
                changeType(repeatPasswordRegister, 'text');
                clearTimeout(repeatRegisterTimeout);
            } else {
                changeType(repeatPasswordRegister, 'password');
            };
        }, 200);
    });

    repeatPasswordRegister.addEventListener('mouseout', async (e) => {
        changeType(repeatPasswordRegister, 'password');
    });

    repeatPasswordRegister.addEventListener('touchstart', async (e) => {
        changeType(repeatPasswordRegister, 'text');
    });

    repeatPasswordRegister.addEventListener('touchend', async (e) => {
        changeType(repeatPasswordRegister, 'password');
    });

    loginForm.addEventListener('submit', async (e) => {

        e.preventDefault();

        let csrfToken = document.querySelector('input[name="csrf_token"').value;

        let formData = new FormData(loginForm);
        let formDataJson = {};

        
        Array.from(formData.entries()).forEach(([key, value]) => {
            formDataJson[key] = value;
        });

        await fetch('/login', {
            method: 'POST',
            body: JSON.stringify(formDataJson),
            headers: {
                'X-CSRF-Token': csrfToken,
                'Content-Type': 'application/json',
            },
            keepalive: true,
        }).then(res => res.text()).then(data => {
            if (data.toString().toLowerCase().includes('error') && !data.toString().toLowerCase().includes('html')) {
                document.getElementById('login-error').innerText = data.toString();
            } else {
                document.open();
                document.write(data.toString());
                document.close();
            };
        })
        .catch((err) => {
            document.getElementById('login-error').innerText = err;
        });
    });

    registerForm.addEventListener('submit', async (e) => {

        console.log('Called');

        e.preventDefault();

        let csrfToken = document.querySelector('input[name="csrf_token"').value;

        // let repeatPassword = document.querySelector('input[name="repeat_password"]').value;
        let formData = new FormData(registerForm);        
        let formDataJson = {};
        
        Array.from(formData.entries()).forEach(([key, value]) => {
            formDataJson[key] = value;
        });

        // formDataJson['repeat_password'] = repeatPassword;

        console.log(formDataJson);

        await fetch('/register', {
            method: 'POST',
            body: JSON.stringify(formDataJson),
            headers: {
                'X-CSRF-Token': csrfToken,
                'Content-Type': 'application/json',
            },
            keepalive: true,
        }).then((res) => {

            return res.text();
        }).then(data => {
            if (data.toString().includes('html')) {
                document.open();
                document.write(data);
                document.close();
            } else {
                document.getElementById('register-error').innerText = data;
            }
        })
        .catch((err) => {
            document.getElementById('register-error').innerText = err;
        });
    });

    document.getElementById('register-error').style.color = 'red';

    function testpw(val) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@$%^&*])[a-zA-Z\d!@$%^&*]{8,}$/.test(val);
    };

    function testpwd(val) {
        let test = testpw(val);

        if (test === false) {
            document.getElementById('register-error').style.color = 'red';
            document.getElementById('register-error').innerText = 'Please use atleat 1 symbol, number, and letter. Min length of 8';
        } else {
            document.getElementById('register-error').innerText = "Password correct";
            document.getElementById('register-error').style.color = 'green';
        };
    };

    document.querySelector('input[name="password"]').addEventListener('click', async (e) => {
        testpwd(e.value);
    });
});