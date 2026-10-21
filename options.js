// Options script for RSI Assist - Full configuration page

document.addEventListener
(
	'DOMContentLoaded',
	function ()
	{
		const exportBtn = document.getElementById('export-btn');
		const importBtn = document.getElementById('import-btn');
		const importFile = document.getElementById('import-file');
		const statusElement = document.getElementById('status');
		const domainsListElement = document.getElementById('domains-list');
		
		function showStatus(message)
		{
			statusElement.textContent = message;
			setTimeout
			(
				function ()
				{
					statusElement.textContent = '';
				},
				3000
			);
		}
		
		function loadAllData()
		{
			chrome.storage.local.get
			(
				null,
				function (items)
				{
					domainsListElement.innerHTML = '';
					
					const domainMap = {};
					
					Object.keys(items).forEach
					(
						function (key)
						{
							if (key.startsWith('floatingList_') || key.startsWith('floatingPos_'))
							{
								return;
							}
							
							const snippets = items[key];
							if (Array.isArray(snippets))
							{
								domainMap[key] = {
									snippets: snippets,
									floating: !!items['floatingList_' + key],
									pos: items['floatingPos_' + key] || null
								};
							}
						}
					);
					
					const domains = Object.keys(domainMap);
					
					if (domains.length === 0)
					{
						domainsListElement.innerHTML = '<p>Aucun site configuré pour le moment.</p>';
						return;
					}
					
					const table = document.createElement('table');
					const thead = document.createElement('thead');
					thead.innerHTML = '<tr><th>Domaine</th><th>Snippets</th><th>Liste flottante</th><th>Actions</th></tr>';
					table.appendChild(thead);
					
					const tbody = document.createElement('tbody');
					
					domains.forEach
					(
						function (domain)
						{
							const info = domainMap[domain];
							const tr = document.createElement('tr');
							
							const tdDomain = document.createElement('td');
							tdDomain.style.fontWeight = '500';
							tdDomain.textContent = domain;
							
							const tdSnippets = document.createElement('td');
							tdSnippets.textContent = info.snippets.join(', ');
							
							const tdFloating = document.createElement('td');
							tdFloating.textContent = info.floating ? 'Activée' : 'Désactivée';
							
							const tdActions = document.createElement('td');
							const deleteBtn = document.createElement('button');
							deleteBtn.type = 'button';
							deleteBtn.className = 'btn-danger';
							deleteBtn.textContent = 'Supprimer';
							deleteBtn.style.padding = '4px 8px';
							deleteBtn.style.fontSize = '12px';
							
							deleteBtn.addEventListener
							(
								'click',
								function ()
								{
									if (confirm('Voulez-vous vraiment supprimer toutes les données pour ' + domain + ' ?'))
									{
										const keysToRemove = [domain, 'floatingList_' + domain, 'floatingPos_' + domain];
										chrome.storage.local.remove
										(
											keysToRemove,
											function ()
											{
												loadAllData();
												showStatus('Données supprimées pour ' + domain);
											}
										);
									}
								}
							);
							
							tdActions.appendChild(deleteBtn);
							
							tr.appendChild(tdDomain);
							tr.appendChild(tdSnippets);
							tr.appendChild(tdFloating);
							tr.appendChild(tdActions);
							
							tbody.appendChild(tr);
						}
					);
					
					table.appendChild(tbody);
					domainsListElement.appendChild(table);
				}
			);
		}
		
		exportBtn.addEventListener
		(
			'click',
			function ()
			{
				chrome.storage.local.get
				(
					null,
					function (items)
					{
						const dataStr = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
						const downloadAnchor = document.createElement('a');
						downloadAnchor.setAttribute('href', dataStr);
						downloadAnchor.setAttribute('download', 'rsi-assist-backup-' + new Date().toISOString().slice(0, 10) + '.json');
						document.body.appendChild(downloadAnchor);
						downloadAnchor.click();
						downloadAnchor.remove();
						
						showStatus('Export de toutes les données réussi !');
					}
				);
			}
		);
		
		importBtn.addEventListener
		(
			'click',
			function ()
			{
				importFile.click();
			}
		);
		
		importFile.addEventListener
		(
			'change',
			function (e)
			{
				const file = e.target.files[0];
				if (!file)
				{
					return;
				}
				
				const reader = new FileReader();
				reader.onload = function (event)
				{
					try
					{
						const parsed = JSON.parse(event.target.result);
						if (!parsed || typeof parsed !== 'object')
						{
							throw new Error('Format JSON invalide');
						}
						
						chrome.storage.local.set
						(
							parsed,
							function ()
							{
								loadAllData();
								showStatus('Importation réussie !');
								importFile.value = '';
							}
						);
					}
					catch (error)
					{
						console.error('Error importing JSON:', error);
						showStatus('Erreur lors de l\'importation (fichier JSON invalide)');
						importFile.value = '';
					}
				};
				reader.readAsText(file);
			}
		);
		
		loadAllData();
	}
);
