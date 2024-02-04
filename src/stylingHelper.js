// the tile-type checkboxes should only be visible if the installation or replacement options of the job-type checkboxes are checked
// Path: src/stylingHelper.js
const installbox = document.getElementById('installation');
const replacebox = document.getElementById('replacement');
const tileSelect = document.querySelector('.tile-type');

installbox.addEventListener('change', () => {
    tileSelect.classList.toggle('hidden', !installbox.checked);
});

replacebox.addEventListener('change', () => {
    tileSelect.classList.toggle('hidden', !replacebox.checked);
});