// Content script for RSI Assist
// Handles insertion of preconfigured text snippets into the focused element.

chrome.runtime.onMessage.addListener
(
	function (request, sender, sendResponse)
	{
		if (request.action === 'insertText')
		{
			const activeElement = document.activeElement;
			if (activeElement)
			{
				if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')
				{
					const start = activeElement.selectionStart;
					const end = activeElement.selectionEnd;
					const value = activeElement.value;
					
					activeElement.value = value.substring(0, start) + request.text + value.substring(end);
					activeElement.selectionStart = activeElement.selectionEnd = start + request.text.length;
					
					// Dispatch input event to notify frameworks of change
					activeElement.dispatchEvent(new Event('input', { bubbles: true }));
					activeElement.dispatchEvent(new Event('change', { bubbles: true }));
				}
				else if (activeElement.isContentEditable)
				{
					const selection = window.getSelection();
					if (selection.rangeCount > 0)
					{
						const range = selection.getRangeAt(0);
						range.deleteContents();
						const textNode = document.createTextNode(request.text);
						range.insertNode(textNode);
						range.setStartAfter(textNode);
						range.setEndAfter(textNode);
						selection.removeAllRanges();
						selection.addRange(range);
					}
				}
			}
		}
	}
);
