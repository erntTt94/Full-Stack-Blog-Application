document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function () {
            const commentId = this.getAttribute('data-id');
            document.getElementById(`edit-form-${commentId}`).style.display = 'block';
            this.style.display = 'none';
            document.getElementById(`delete-form-${commentId}`).style.display = 'none';

        })
    })
    document.querySelectorAll('.cancel-btn').forEach(button => {
        button.addEventListener('click', function () {
            const commentId = this.getAttribute('data-id');
            document.getElementById(`edit-form-${commentId}`).style.display = 'none';
            document.querySelector(`.edit-btn[data-id='${commentId}']`).style.display = 'inline';
            document.getElementById(`delete-form-${commentId}`).style.display = 'inherit';
        })
    })
});