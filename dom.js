const cover = document.getElementById('cover')


cover.addEventListener('click', () => {
  cover.classList.add('disappear')
  setTimeout(()=> {
    cover.classList.add('noDisplay')
  }, 3000)
})