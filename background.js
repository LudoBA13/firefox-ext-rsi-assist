// Background script for RSI Assist
// Manages context menus and text insertion routing based on exact hostnames.

const CONTEXT_MENU_PARENT_ID = 'rsi-assist-parent';

// Initialize context menu on install or startup
chrome.runtime.onInstalled.addListener
(
	function ()
	{
		chrome.contextMenus.create
		(
			{
				id: CONTEXT_MENU_PARENT_ID,
				title: 'RSI Assist',
				contexts: ['editable']
			}
		);
		updateContextMenus();
	}
);

// Update context menus when tab changes or activates
chrome.tabs.onActivated.addListener
(
	function (activeInfo)
	{
		updateContextMenus();
	}
);

chrome.tabs.onUpdated.addListener
(
	function (tabId, changeInfo, tab)
	{
		if (changeInfo.status === 'complete' && tab.active)
		{
			updateContextMenus();
		}
	}
);

// Function to update context menu items for the current active tab hostname
function updateContextMenus()
{
	chrome.tabs.query
	(
		{ active: true, currentWindow: true },
		function (tabs)
		{
			if (tabs.length === 0)
			{
				return;
			}

			const tab = tabs[0];
			if (!tab.url)
			{
				return;
			}

			try
			{
				const url = new URL(tab.url);
				const hostname = url.hostname;

				chrome.storage.local.get
				(
					[hostname],
					function (result)
					{
						chrome.contextMenus.removeAll
						(
							function ()
							{
								// Recreate parent
								chrome.contextMenus.create
								(
									{
										id: CONTEXT_MENU_PARENT_ID,
										title: 'RSI Assist',
										contexts: ['editable']
									}
								);

								const snippets = result[hostname] || [];
								if (snippets.length === 0)
								{
									chrome.contextMenus.create
                           (
                              {
                                 id: 'rsi-assist-empty',
                                 parentId: CONTEXT_MENU_PARENT_ID,
                                 title: 'Aucun texte configuré',
                                 contexts: ['editable'],
                                 enabled: false
                              }
                           );
								}
								else
								{
									snippets.forEach
									(
										function (snippet, index)
										{
											// Truncate display title if too long
											const displayTitle = snippet.length > 30 ? snippet.substring(0, 27) + '...' : snippet;
											chrome.contextMenus.create
											(
												{
													id: 'rsi-assist-snippet-' + index,
													parentId: CONTEXT_MENU_PARENT_ID,
													title: displayTitle,
													contexts: ['editable']
												}
											);
										}
									);
								}
							}
						);
					}
				);
			}
			catch (error)
			{
				console.error('Invalid URL for context menu update:', error);
			}
		}
	);
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener
(
	function (info, tab)
	{
		if (info.menuItemId.toString().startsWith('rsi-assist-snippet-'))
		{
			const indexStr = info.menuItemId.toString().replace('rsi-assist-snippet-', '');
			const index = parseInt(indexStr, 10);

			if (tab && tab.url)
			{
				try
				{
					const url = new URL(tab.url);
					const hostname = url.hostname;

					chrome.storage.local.get
					(
						[hostname],
						function (result)
						{
							const snippets = result[hostname] || [];
							if (snippets[index] !== undefined)
							{
								chrome.tabs.sendMessage
								(
									tab.id,
									{
										action: 'insertText',
										text: snippets[index]
									}
								);
							}
						}
					);
				}
				catch (error)
				{
					console.error('Error handling context menu click:', error);
				}
			}
		}
	}
);

// Listen for storage changes to update context menus dynamically
chrome.storage.onChanged.addListener
(
	function (changes, areaName)
	{
		if (areaName === 'local')
		{
			updateContextMenus();
		}
	}
);
