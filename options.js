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
		const fontSizeSlider = document.getElementById('font-size-slider');
		const fontSizeValue = document.getElementById('font-size-value');
		const fontSizePreview = document.getElementById('font-size-preview');
		const prefStatusElement = document.getElementById('pref-status');

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

		function showPrefStatus(message)
		{
			prefStatusElement.textContent = message;
			setTimeout
			(
				function ()
				{
					prefStatusElement.textContent = '';
				},
				3000
			);
		}

		function applyFontSize(size)
		{
			const numericVal = typeof size === 'number' ? size : parseInt(size, 10);
			if (!isNaN(numericVal))
			{
				fontSizeSlider.value = numericVal;
				fontSizeValue.textContent = numericVal + 'px';
				fontSizePreview.style.fontSize = numericVal + 'px';
			}
		}

		function loadFontSizePreference()
		{
			chrome.storage.local.get
			(
				['floatingFontSize'],
				function (result)
				{
					if (result.floatingFontSize !== undefined)
					{
						applyFontSize(result.floatingFontSize);
					}
				}
			);
		}

		function setupFontSizeListener()
		{
			fontSizeSlider.addEventListener
			(
				'input',
				function ()
				{
					const val = parseInt(fontSizeSlider.value, 10);
					applyFontSize(val);
					chrome.storage.local.set
					(
						{ floatingFontSize: val },
						function ()
						{
							showPrefStatus('Taille du texte enregistrée !');
						}
					);
				}
			);
		}

		function buildDomainMap(items)
		{
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
			return domainMap;
		}

		function deleteDomainData(domain, reloadCallback)
		{
			if (confirm('Voulez-vous vraiment supprimer toutes les données pour ' + domain + ' ?'))
			{
				const keysToRemove = [domain, 'floatingList_' + domain, 'floatingPos_' + domain];
				chrome.storage.local.remove
				(
					keysToRemove,
					function ()
					{
						reloadCallback();
						showStatus('Données supprimées pour ' + domain);
					}
				);
			}
		}

		function createDomainTableRow(domain, info, reloadCallback)
		{
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
					deleteDomainData(domain, reloadCallback);
				}
			);

			tdActions.appendChild(deleteBtn);

			tr.appendChild(tdDomain);
			tr.appendChild(tdSnippets);
			tr.appendChild(tdFloating);
			tr.appendChild(tdActions);

			return tr;
		}

		function renderDomainsTable(domainMap)
		{
			domainsListElement.innerHTML = '';
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
					const row = createDomainTableRow(domain, info, loadAllData);
					tbody.appendChild(row);
				}
			);

			table.appendChild(tbody);
			domainsListElement.appendChild(table);
		}

		function loadAllData()
		{
			chrome.storage.local.get
			(
				null,
				function (items)
				{
					const domainMap = buildDomainMap(items);
					renderDomainsTable(domainMap);
				}
			);
		}

		function processExportItems(items)
		{
			const exportData = {
				global: {},
				local: {}
			};

			const globalKeys = ['floatingFontSize'];
			const domainMap = {};

			Object.keys(items).forEach
			(
				function (key)
				{
					if (globalKeys.includes(key))
					{
						if (key === 'floatingFontSize')
						{
							const num = parseInt(items[key], 10);
							exportData.global[key] = isNaN(num) ? 13 : num;
						}
						else
						{
							exportData.global[key] = items[key];
						}
					}
					else if (key.startsWith('floatingList_'))
					{
						const domain = key.replace('floatingList_', '');
						if (!domainMap[domain])
						{
							domainMap[domain] = {};
						}
						domainMap[domain].floatingList = items[key];
					}
					else if (key.startsWith('floatingPos_'))
					{
						const domain = key.replace('floatingPos_', '');
						if (!domainMap[domain])
						{
							domainMap[domain] = {};
						}
						domainMap[domain].floatingPos = items[key];
					}
					else
					{
						if (!domainMap[key])
						{
							domainMap[key] = {};
						}
						domainMap[key].snippets = items[key];
					}
				}
			);

			exportData.local = domainMap;
			return exportData;
		}

		function downloadBackupFile(exportData)
		{
			const dataStr = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
			const downloadAnchor = document.createElement('a');
			downloadAnchor.setAttribute('href', dataStr);
			downloadAnchor.setAttribute('download', 'rsi-assist-backup-' + new Date().toISOString().slice(0, 10) + '.json');
			document.body.appendChild(downloadAnchor);
			downloadAnchor.click();
			downloadAnchor.remove();
			showStatus('Export de toutes les données réussi !');
		}

		function setupExportListener()
		{
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
							const exportData = processExportItems(items);
							downloadBackupFile(exportData);
						}
					);
				}
			);
		}

		function setupImportTrigger()
		{
			importBtn.addEventListener
			(
				'click',
				function ()
				{
					importFile.click();
				}
			);
		}

		function parseGlobalImport(globalObj, flatData)
		{
			if (globalObj && typeof globalObj === 'object')
			{
				Object.keys(globalObj).forEach
				(
					function (key)
					{
						if (key === 'floatingFontSize')
						{
							const parsedNum = parseInt(globalObj[key], 10);
							flatData[key] = isNaN(parsedNum) ? 13 : parsedNum;
						}
						else
						{
							flatData[key] = globalObj[key];
						}
					}
				);
			}
		}

		function parseLocalImport(localObj, flatData)
		{
			if (localObj && typeof localObj === 'object')
			{
				Object.keys(localObj).forEach
				(
					function (domain)
					{
						const siteData = localObj[domain];
						if (siteData && typeof siteData === 'object')
						{
							if (Array.isArray(siteData.snippets))
							{
								flatData[domain] = siteData.snippets;
							}
							if (typeof siteData.floatingList === 'boolean')
							{
								flatData['floatingList_' + domain] = siteData.floatingList;
							}
							if (siteData.floatingPos)
							{
								flatData['floatingPos_' + domain] = siteData.floatingPos;
							}
						}
					}
				);
			}
		}

		function processImportData(parsed)
		{
			if (!parsed || typeof parsed !== 'object')
			{
				throw new Error('Format JSON invalide');
			}

			const flatData = {};
			parseGlobalImport(parsed.global, flatData);
			parseLocalImport(parsed.local, flatData);
			return flatData;
		}

		function applyImportedData(flatData)
		{
			chrome.storage.local.clear
			(
				function ()
				{
					chrome.storage.local.set
					(
						flatData,
						function ()
						{
							loadAllData();
							loadFontSizePreference();
							showStatus('Importation réussie !');
							importFile.value = '';
						}
					);
				}
			);
		}

		function setupImportListener()
		{
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
							const flatData = processImportData(parsed);
							applyImportedData(flatData);
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
		}

		loadFontSizePreference();
		setupFontSizeListener();
		setupExportListener();
		setupImportTrigger();
		setupImportListener();
		loadAllData();
	}
);
