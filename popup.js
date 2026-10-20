// Popup script for RSI Assist
// Manages loading, editing, auto-saving, and deleting snippets per exact hostname.

document.addEventListener
(
	'DOMContentLoaded',
	function ()
	{
		const hostnameElement = document.getElementById('hostname');
		const snippetsListElement = document.getElementById('snippets-list');
		const floatingToggleBtn = document.getElementById('floating-toggle-btn');
		const addBtn = document.getElementById('add-btn');
		const clearBtn = document.getElementById('clear-btn');
		const exportBtn = document.getElementById('export-btn');
		const importBtn = document.getElementById('import-btn');
		const statusElement = document.getElementById('status');
		
		let currentHostname = '';
		let floatingEnabledState = false;
		let saveTimeout = null;
		
		// Query active tab to get exact hostname
		chrome.tabs.query
		(
			{ active: true, currentWindow: true },
			function (tabs)
			{
				if (tabs.length === 0)
				{
					hostnameElement.textContent = 'Aucun onglet actif';
					return;
				}
				
				const tab = tabs[0];
				if (!tab.url)
				{
					hostnameElement.textContent = 'URL non disponible';
					return;
				}
				
				try
				{
					const url = new URL(tab.url);
					currentHostname = url.hostname;
					hostnameElement.textContent = currentHostname;
					
					loadSnippets();
				}
				catch (error)
				{
					hostnameElement.textContent = 'URL invalide';
					console.error('Error parsing URL:', error);
				}
			}
		);
		
		function updateFloatingToggleUI(enabled)
		{
			floatingEnabledState = enabled;
			if (enabled)
			{
				floatingToggleBtn.textContent = 'Liste flottante : Activée';
				floatingToggleBtn.style.backgroundColor = '#28a745';
				floatingToggleBtn.style.color = 'white';
			}
			else
			{
				floatingToggleBtn.textContent = 'Liste flottante : Désactivée';
				floatingToggleBtn.style.backgroundColor = '';
				floatingToggleBtn.style.color = '';
			}
		}
		
		floatingToggleBtn.addEventListener
		(
			'click',
			function ()
			{
				if (!currentHostname)
				{
					return;
				}
				
				const newState = !floatingEnabledState;
				updateFloatingToggleUI(newState);
				
				const floatingKey = 'floatingList_' + currentHostname;
				const data = {};
				data[floatingKey] = newState;
				
				chrome.storage.local.set
				(
					data,
					function ()
					{
						showStatus(newState ? 'Liste flottante activée' : 'Liste flottante désactivée');
					}
				);
			}
		);
		
		function triggerAutoSave()
		{
			if (!currentHostname)
			{
				return;
			}
			
			if (saveTimeout)
			{
				clearTimeout(saveTimeout);
			}
			
			saveTimeout = setTimeout
			(
				function ()
				{
					const inputs = snippetsListElement.querySelectorAll('input[type="text"]');
					const snippets = [];
					
					inputs.forEach
					(
						function (input)
						{
							const trimmed = input.value.trim();
							if (trimmed.length > 0)
							{
								snippets.push(trimmed);
							}
						}
					);
					
					const data = {};
					data[currentHostname] = snippets;
					
					chrome.storage.local.set
					(
						data,
						function ()
						{
							showStatus('Modifications enregistrées');
						}
					);
				},
				300
			);
		}
		
		function loadSnippets()
		{
			if (!currentHostname)
			{
				return;
			}
			
			const floatingKey = 'floatingList_' + currentHostname;
			chrome.storage.local.get
			(
				[currentHostname, floatingKey],
				function (result)
				{
					const snippets = result[currentHostname] || [];
					const isFloatingEnabled = !!result[floatingKey];
					
					updateFloatingToggleUI(isFloatingEnabled);
					
					snippetsListElement.innerHTML = '';
					
					if (snippets.length === 0)
					{
						addSnippetInput('', false);
					}
					else
					{
						snippets.forEach
						(
							function (snippet)
							{
								addSnippetInput(snippet, false);
							}
						);
					}
				}
			);
		}
		
		function addSnippetInput(value, saveOnChange = true)
		{
			const container = document.createElement('div');
			container.className = 'snippet-container';
			
			const input = document.createElement('input');
			input.type = 'text';
			input.value = value;
			input.placeholder = 'Entrez votre texte...';
			
			const deleteBtn = document.createElement('button');
			deleteBtn.type = 'button';
			deleteBtn.className = 'btn-danger';
			deleteBtn.textContent = '✕';
			deleteBtn.title = 'Supprimer';
			
			deleteBtn.addEventListener
			(
				'click',
				function ()
				{
					container.remove();
					triggerAutoSave();
				}
			);
			
			container.appendChild(input);
			container.appendChild(deleteBtn);
			snippetsListElement.appendChild(container);
			
			if (saveOnChange)
			{
				triggerAutoSave();
			}
		}
		
		snippetsListElement.addEventListener
		(
			'input',
			function ()
			{
				triggerAutoSave();
			}
		);
		
		addBtn.addEventListener
		(
			'click',
			function ()
			{
				addSnippetInput('');
			}
		);
		
		clearBtn.addEventListener
		(
			'click',
			function ()
			{
				if (!currentHostname)
				{
					return;
				}
				
				if (confirm('Voulez-vous vraiment supprimer tous les textes pour ce site ?'))
				{
					const floatingKey = 'floatingList_' + currentHostname;
					chrome.storage.local.remove
					(
						[currentHostname, floatingKey],
						function ()
						{
							snippetsListElement.innerHTML = '';
							addSnippetInput('', false);
							updateFloatingToggleUI(false);
							showStatus('Supprimé avec succès !');
						}
					);
				}
			}
		);
		
		exportBtn.addEventListener
		(
			'click',
			function ()
			{
				if (!currentHostname)
				{
					return;
				}
				
				const inputs = snippetsListElement.querySelectorAll('input[type="text"]');
				const snippets = [];
				
				inputs.forEach
				(
					function (input)
					{
						const trimmed = input.value.trim();
						if (trimmed.length > 0)
						{
							snippets.push(trimmed);
						}
					}
				);
				
				const exportData = {
					hostname: currentHostname,
					snippets: snippets,
					floatingList: floatingEnabledState
				};
				
				const dataStr = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
				const downloadAnchor = document.createElement('a');
				downloadAnchor.setAttribute('href', dataStr);
				downloadAnchor.setAttribute('download', 'rsi-assist-' + currentHostname + '.json');
				document.body.appendChild(downloadAnchor);
				downloadAnchor.click();
				downloadAnchor.remove();
				
				showStatus('Exporté avec succès !');
			}
		);
		
		importBtn.addEventListener
		(
			'click',
			function ()
			{
				if (!currentHostname)
				{
					return;
				}
				
				const jsonInput = prompt('Collez le contenu JSON exporté pour importer les snippets :', '');
				if (!jsonInput)
				{
					return;
				}
				
				try
				{
					const parsed = JSON.parse(jsonInput);
					let importedSnippets = [];
					
					if (Array.isArray(parsed))
					{
						importedSnippets = parsed;
					}
					else if (parsed && Array.isArray(parsed.snippets))
					{
						importedSnippets = parsed.snippets;
					}
					else
					{
						throw new Error('Format JSON invalide');
					}
					
					if (importedSnippets.length === 0)
					{
						showStatus('Aucun texte à importer');
						return;
					}
					
					const inputs = snippetsListElement.querySelectorAll('input[type="text"]');
					if (inputs.length === 1 && inputs[0].value.trim() === '')
					{
						snippetsListElement.innerHTML = '';
					}
					
					importedSnippets.forEach
					(
						function (snippet)
						{
							if (typeof snippet === 'string' && snippet.trim().length > 0)
							{
								addSnippetInput(snippet.trim(), false);
							}
						}
					);
					
					if (parsed && typeof parsed.floatingList === 'boolean')
					{
						updateFloatingToggleUI(parsed.floatingList);
						const floatingKey = 'floatingList_' + currentHostname;
						const floatingData = {};
						floatingData[floatingKey] = parsed.floatingList;
						chrome.storage.local.set(floatingData);
					}
					
					triggerAutoSave();
					showStatus('Importé et enregistré !');
				}
				catch (error)
				{
					console.error('Error importing JSON:', error);
					showStatus('Erreur lors de l\'importation (JSON invalide)');
				}
			}
		);
		
		function showStatus(message)
		{
			statusElement.textContent = message;
			setTimeout
			(
				function ()
				{
					statusElement.textContent = '';
				},
				2000
			);
		}
	}
);
