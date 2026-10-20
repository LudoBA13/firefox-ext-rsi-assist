// Popup script for RSI Assist
// Manages loading, editing, saving, and deleting snippets per exact hostname.

document.addEventListener
(
	'DOMContentLoaded',
	function ()
	{
		const hostnameElement = document.getElementById('hostname');
		const snippetsListElement = document.getElementById('snippets-list');
		const floatingToggleBtn = document.getElementById('floating-toggle-btn');
		const addBtn = document.getElementById('add-btn');
		const saveBtn = document.getElementById('save-btn');
		const clearBtn = document.getElementById('clear-btn');
		const statusElement = document.getElementById('status');
		
		let currentHostname = '';
		let floatingEnabledState = false;
		
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
						addSnippetInput('');
					}
					else
					{
						snippets.forEach
						(
							function (snippet)
							{
								addSnippetInput(snippet);
							}
						);
					}
				}
			);
		}
		
		function addSnippetInput(value)
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
				}
			);
			
			container.appendChild(input);
			container.appendChild(deleteBtn);
			snippetsListElement.appendChild(container);
		}
		
		addBtn.addEventListener
		(
			'click',
			function ()
			{
				addSnippetInput('');
			}
		);
		
		saveBtn.addEventListener
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
				
				const data = {};
				data[currentHostname] = snippets;
				
				chrome.storage.local.set
				(
					data,
					function ()
					{
						showStatus('Enregistré avec succès !');
					}
				);
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
							addSnippetInput('');
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
