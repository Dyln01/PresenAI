document.addEventListener('DOMContentLoaded', async () => {
    if (localStorage.getItem('pres-loading') !== undefined) {
        let title = document.title.toString() + ' - Creating Presentation';

        document.title = title;

        setInterval(() => {
            
        }, 500);
    }
})