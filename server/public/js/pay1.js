document.addEventListener('DOMContentLoaded', async () => {

    const pubKey = "Your public stripe key";
    const stripe = Stripe(pubKey);

    let clientSecret = document.getElementById('client-secret').value;
    let paymentEl = document.getElementById('payment-el');
    let submitBtn = document.getElementById('submit-btn').innerText;

    if (!clientSecret.toString().includes('_secret_')) {
        paymentEl.innerText = clientSecret;
    } else {
        let int = clientSecret;

        const element = stripe.elements({
            clientSecret: int,
        });
        const paymentEl = element.create('payment');

        paymentEl.mount('#payment-el');

        document.getElementById('payment-form').addEventListener('submit', async (e) => {

            e.preventDefault();

            let price = submitBtn.toString().split('$')[1].toString();

            let url = `http://localhost:3000/payment/complete?price=${price.toString()}`;
            let uri = encodeURI(url);

            await stripe.confirmPayment({
                elements: element,
                confirmParams: {
                    return_url: uri,
                },
            }).then((res) => {
                if (res.error) {
                    console.log(res.error);
                    document.getElementById('error-p').textContent = res.error.message;
                };
            });
        });
    };
})