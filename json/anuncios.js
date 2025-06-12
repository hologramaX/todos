  window.addEventListener('load', () => {
    const closeBtn = document.getElementById('closeBtn');
    const modal = document.getElementById('modal');

    // Mostrar la X después de 2 segundos
    setTimeout(() => {
      closeBtn.style.display = 'block';
    }, 2000);

    // Al hacer clic en la X, ocultar el modal
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  });