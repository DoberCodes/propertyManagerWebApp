(() => {
	const menus = Array.from(document.querySelectorAll('[data-public-nav-menu]'));
	if (!menus.length) return;

	const closeMenus = (except) => {
		for (const menu of menus) {
			if (menu !== except) menu.removeAttribute('open');
		}
	};

	for (const menu of menus) {
		menu.addEventListener('toggle', () => {
			if (menu.open) closeMenus(menu);
		});
		menu.querySelectorAll('a').forEach((link) => {
			link.addEventListener('click', () => closeMenus());
		});
	}

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') closeMenus();
	});
	document.addEventListener('pointerdown', (event) => {
		if (!(event.target instanceof Element) || !event.target.closest('.site-nav')) closeMenus();
	});
})();
