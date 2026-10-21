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
		const configBtn = document.getElementById('config-btn');
		const addBtn = document.getElementById('add-btn');
		const clearBtn = document.getElementById('clear-btn');
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
				floatingToggleBtn.textContent = 'Flottante : On';
				floatingToggleBtn.style.backgroundColor = '#28a745';
				floatingToggleBtn.style.color = 'white';
			}
			else
			{
				floatingToggleBtn.textContent = 'Flottante : Off';
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
		
		configBtn.addEventListener
		(
			'click',
			function ()
			{
				if (chrome.runtime.openOptionsPage)
				{
					chrome.runtime.openOptionsPage();
				}
				else
				{
					window.open(chrome.runtime.getURL('options.html'));
				}
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
