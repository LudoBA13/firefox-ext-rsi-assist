// Popup script for RSI Assist
// Manages loading, editing, saving, and deleting snippets per exact hostname.

document.addEventListener
(
	'DOMContentLoaded',
	function ()
	{
		const hostnameElement = document.getElementById('hostname');
		const snippetsListElement = document.getElementById('snippets-list');
		const addBtn = document.getElementById('add-btn');
		const saveBtn = document.getElementById('save-btn');
		const clearBtn = document.getElementById('clear-btn');
		const statusElement = document.getElementById('status');
		
		let currentHostname = '';
		
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
		
		function loadSnippets()
		{
			if (!currentHostname)
			{
				return;
			}
			
			chrome.storage.local.get
			(
				[currentHostname],
				function (result)
				{
					const snippets = result[currentHostname] || [];
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
					chrome.storage.local.remove
					(
						currentHostname,
						function ()
						{
							snippetsListElement.innerHTML = '';
							addSnippetInput('');
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
