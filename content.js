// Content script for RSI Assist
// Handles insertion of text snippets and floating list rendering via Shadow DOM.

(
	function ()
	{
		const HOST_ID = 'rsi-assist-floating-host';
		
		function simulateTabKey(element)
		{
			const keydownEvent = new KeyboardEvent
			(
				'keydown',
				{
					key: 'Tab',
					code: 'Tab',
					keyCode: 9,
					which: 9,
					bubbles: true,
					cancelable: true
				}
			);
			const keypressEvent = new KeyboardEvent
			(
				'keypress',
				{
					key: 'Tab',
					code: 'Tab',
					keyCode: 9,
					which: 9,
					bubbles: true,
					cancelable: true
				}
			);
			const keyupEvent = new KeyboardEvent
			(
				'keyup',
				{
					key: 'Tab',
					code: 'Tab',
					keyCode: 9,
					which: 9,
					bubbles: true,
					cancelable: true
				}
			);
			
			element.dispatchEvent(keydownEvent);
			element.dispatchEvent(keypressEvent);
			element.dispatchEvent(keyupEvent);
		}
		
		function insertText(text)
		{
			const activeElement = document.activeElement;
			if (!activeElement)
			{
				return;
			}
			
			if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')
			{
				const start = activeElement.selectionStart;
				const end = activeElement.selectionEnd;
				const value = activeElement.value;
				
				activeElement.value = value.substring(0, start) + text + value.substring(end);
				activeElement.selectionStart = activeElement.selectionEnd = start + text.length;
				
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
					const textNode = document.createTextNode(text);
					range.insertNode(textNode);
					range.setStartAfter(textNode);
					range.setEndAfter(textNode);
					selection.removeAllRanges();
					selection.addRange(range);
				}
			}
			
			setTimeout
			(
				function ()
				{
					simulateTabKey(activeElement);
				},
				200
			);
		}
		
		function removeFloatingList()
		{
			const existingHost = document.getElementById(HOST_ID);
			if (existingHost)
			{
				existingHost.remove();
			}
		}
		
		function renderFloatingList(snippets)
		{
			removeFloatingList();
			
			if (!document.body)
			{
				return;
			}
			
			const host = document.createElement('div');
			host.id = HOST_ID;
			document.body.appendChild(host);
			
			const shadowRoot = host.attachShadow({ mode: 'closed' });
			
			const style = document.createElement('style');
			style.textContent = `
				.rsi-box {
					position: fixed;
					top: 20px;
					right: 20px;
					width: 240px;
					background: #ffffff;
					border: 1px solid #cbccd1;
					border-radius: 8px;
					box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
					font-size: 13px;
					z-index: 2147483647;
					box-sizing: border-box;
					overflow: hidden;
				}
				.rsi-header {
					background: #0060df;
					color: #ffffff;
					padding: 8px 12px;
					font-weight: 600;
					cursor: grab;
					user-select: none;
					display: flex;
					justify-content: space-between;
					align-items: center;
					border-top-left-radius: 7px;
					border-top-right-radius: 7px;
				}
				.rsi-header:active {
					cursor: grabbing;
				}
				.rsi-title {
					font-size: 13px;
					letter-spacing: 0.3px;
				}
				.rsi-body {
					padding: 8px;
					max-height: 280px;
					overflow-y: auto;
					display: flex;
					flex-direction: column;
					gap: 6px;
				}
				.rsi-btn {
					display: block;
					width: 100%;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					text-align: left;
					padding: 6px 10px;
					background: #f1f3f5;
					border: 1px solid #dcdfe6;
					border-radius: 4px;
					cursor: pointer;
					font-size: 13px;
					color: #24292e;
					box-sizing: border-box;
					transition: background 0.15s ease, border-color 0.15s ease;
				}
				.rsi-btn:hover {
					background: #e2e6ea;
					border-color: #c0c4cc;
				}
			`;
			
			const box = document.createElement('div');
			box.className = 'rsi-box';
			
			const header = document.createElement('div');
			header.className = 'rsi-header';
			
			const titleSpan = document.createElement('span');
			titleSpan.className = 'rsi-title';
			titleSpan.textContent = 'RSI Assist';
			header.appendChild(titleSpan);
			
			const body = document.createElement('div');
			body.className = 'rsi-body';
			
			snippets.forEach
			(
				function (snippet)
				{
					const btn = document.createElement('button');
					btn.type = 'button';
					btn.className = 'rsi-btn';
					btn.textContent = snippet;
					btn.title = snippet;
					
					btn.addEventListener
					(
						'mousedown',
						function (e)
						{
							e.preventDefault();
							e.stopPropagation();
							insertText(snippet);
						}
					);
					
					btn.addEventListener
					(
						'mouseup',
						function (e)
						{
							e.preventDefault();
							e.stopPropagation();
						}
					);
					
					btn.addEventListener
					(
						'click',
						function (e)
						{
							e.preventDefault();
							e.stopPropagation();
						}
					);
					
					body.appendChild(btn);
				}
			);
			
			box.appendChild(header);
			box.appendChild(body);
			shadowRoot.appendChild(style);
			shadowRoot.appendChild(box);
			
			// Dragging logic
			header.addEventListener
			(
				'mousedown',
				function (e)
				{
					e.preventDefault();
					const rect = box.getBoundingClientRect();
					const offsetX = e.clientX - rect.left;
					const offsetY = e.clientY - rect.top;
					
					box.style.right = 'auto';
					box.style.left = rect.left + 'px';
					box.style.top = rect.top + 'px';
					
					function onMouseMove(moveEvent)
					{
						const newX = moveEvent.clientX - offsetX;
						const newY = moveEvent.clientY - offsetY;
						box.style.left = newX + 'px';
						box.style.top = newY + 'px';
					}
					
					function onMouseUp()
					{
						window.removeEventListener('mousemove', onMouseMove);
						window.removeEventListener('mouseup', onMouseUp);
					}
					
					window.addEventListener('mousemove', onMouseMove);
					window.addEventListener('mouseup', onMouseUp);
				}
			);
		}
		
		function checkAndRenderFloatingList()
		{
			const hostname = window.location.hostname;
			const floatingKey = 'floatingList_' + hostname;
			
			chrome.storage.local.get
			(
				[hostname, floatingKey],
				function (result)
				{
					const snippets = result[hostname] || [];
					const isEnabled = !!result[floatingKey];
					
					if (isEnabled && snippets.length > 0)
					{
						renderFloatingList(snippets);
					}
					else
					{
						removeFloatingList();
					}
				}
			);
		}
		
		chrome.runtime.onMessage.addListener
		(
			function (request, sender, sendResponse)
			{
				if (request.action === 'insertText')
				{
					insertText(request.text);
				}
			}
		);
		
		chrome.storage.onChanged.addListener
		(
			function (changes, areaName)
			{
				if (areaName === 'local')
				{
					checkAndRenderFloatingList();
				}
			}
		);
		
		if (document.readyState === 'loading')
		{
			document.addEventListener
			(
				'DOMContentLoaded',
				checkAndRenderFloatingList
			);
		}
		else
		{
			checkAndRenderFloatingList();
		}
	}
)();
