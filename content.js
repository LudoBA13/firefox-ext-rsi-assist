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
		
		function renderFloatingList(snippets, savedPos)
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
					width: 480px;
					max-height: 99vh;
					min-width: 280px;
					min-height: 120px;
					background: #ffffff;
					border: 1px solid #cbccd1;
					border-radius: 8px;
					box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
					font-size: 13px;
					z-index: 2147483647;
					box-sizing: border-box;
					display: flex;
					flex-direction: column;
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
					flex-shrink: 0;
				}
				.rsi-header:active {
					cursor: grabbing;
				}
				.rsi-title {
					font-size: 13px;
					letter-spacing: 0.3px;
				}
				.rsi-controls {
					display: flex;
					gap: 6px;
					align-items: center;
				}
				.rsi-control-btn {
					background: transparent;
					border: none;
					color: #ffffff;
					cursor: pointer;
					font-size: 13px;
					font-weight: bold;
					padding: 2px 6px;
					border-radius: 4px;
					line-height: 1;
				}
				.rsi-control-btn:hover {
					background: rgba(255, 255, 255, 0.2);
				}
				.rsi-body {
					padding: 8px;
					overflow-y: auto;
					flex: 1;
					display: flex;
					flex-direction: column;
					flex-wrap: wrap;
					max-height: calc(99vh - 50px);
					gap: 6px;
				}
				.rsi-btn {
					display: block;
					width: calc(50% - 3px);
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
				.rsi-resize-handle {
					position: absolute;
					bottom: 0;
					right: 0;
					width: 16px;
					height: 16px;
					cursor: nwse-resize;
					z-index: 10;
					background: linear-gradient(135deg, transparent 50%, #adb5bd 50%, transparent 60%, transparent 70%, #adb5bd 70%, transparent 80%);
					border-bottom-right-radius: 8px;
				}
			`;
			
			const box = document.createElement('div');
			box.className = 'rsi-box';
			
			if (savedPos)
			{
				if (savedPos.left)
				{
					box.style.left = savedPos.left;
					box.style.right = 'auto';
				}
				if (savedPos.top)
				{
					box.style.top = savedPos.top;
				}
				if (savedPos.width)
				{
					box.style.width = savedPos.width;
				}
				if (savedPos.height)
				{
					box.style.height = savedPos.height;
				}
			}
			
			const header = document.createElement('div');
			header.className = 'rsi-header';
			
			const titleSpan = document.createElement('span');
			titleSpan.className = 'rsi-title';
			titleSpan.textContent = 'RSI Assist';
			
			const controlsContainer = document.createElement('div');
			controlsContainer.className = 'rsi-controls';
			
			const shadeBtn = document.createElement('button');
			shadeBtn.type = 'button';
			shadeBtn.className = 'rsi-control-btn';
			shadeBtn.textContent = '_';
			shadeBtn.title = 'Minimiser';
			
			const closeBtn = document.createElement('button');
			closeBtn.type = 'button';
			closeBtn.className = 'rsi-control-btn';
			closeBtn.textContent = '✕';
			closeBtn.title = 'Fermer';
			
			let isShaded = false;
			let previousHeight = '';
			
			shadeBtn.addEventListener
			(
				'mousedown',
				function (e)
				{
					e.preventDefault();
					e.stopPropagation();
				}
			);
			
			shadeBtn.addEventListener
			(
				'click',
				function (e)
				{
					e.preventDefault();
					e.stopPropagation();
					isShaded = !isShaded;
					if (isShaded)
					{
						previousHeight = box.style.height;
						box.style.height = 'auto';
						body.style.display = 'none';
						resizeHandle.style.display = 'none';
						shadeBtn.textContent = '□';
						shadeBtn.title = 'Restaurer';
					}
					else
					{
						box.style.height = previousHeight || '';
						body.style.display = 'flex';
						resizeHandle.style.display = 'block';
						shadeBtn.textContent = '_';
						shadeBtn.title = 'Minimiser';
					}
				}
			);
			
			closeBtn.addEventListener
			(
				'mousedown',
				function (e)
				{
					e.preventDefault();
					e.stopPropagation();
				}
			);
			
			closeBtn.addEventListener
			(
				'click',
				function (e)
				{
					e.preventDefault();
					e.stopPropagation();
					const hostname = window.location.hostname;
					const floatingKey = 'floatingList_' + hostname;
					const data = {};
					data[floatingKey] = false;
					chrome.storage.local.set
					(
						data,
						function ()
						{
							removeFloatingList();
						}
					);
				}
			);
			
			controlsContainer.addEventListener
			(
				'mousedown',
				function (e)
				{
					e.stopPropagation();
				}
			);
			
			controlsContainer.appendChild(shadeBtn);
			controlsContainer.appendChild(closeBtn);
			
			header.appendChild(titleSpan);
			header.appendChild(controlsContainer);
			
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
			
			const resizeHandle = document.createElement('div');
			resizeHandle.className = 'rsi-resize-handle';
			
			box.appendChild(header);
			box.appendChild(body);
			box.appendChild(resizeHandle);
			shadowRoot.appendChild(style);
			shadowRoot.appendChild(box);
			
			function saveFloatingPosition()
			{
				const hostname = window.location.hostname;
				const posKey = 'floatingPos_' + hostname;
				const rect = box.getBoundingClientRect();
				const posData = {
					left: box.style.left || rect.left + 'px',
					top: box.style.top || rect.top + 'px',
					width: box.style.width || rect.width + 'px',
					height: box.style.height || rect.height + 'px'
				};
				const data = {};
				data[posKey] = posData;
				chrome.storage.local.set(data);
			}
			
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
						saveFloatingPosition();
					}
					
					window.addEventListener('mousemove', onMouseMove);
					window.addEventListener('mouseup', onMouseUp);
				}
			);
			
			// Resizing logic
			resizeHandle.addEventListener
			(
				'mousedown',
				function (e)
				{
					e.preventDefault();
					e.stopPropagation();
					const startX = e.clientX;
					const startY = e.clientY;
					const startWidth = box.offsetWidth;
					const startHeight = box.offsetHeight;
					
					const rect = box.getBoundingClientRect();
					box.style.right = 'auto';
					box.style.left = rect.left + 'px';
					box.style.top = rect.top + 'px';
					box.style.width = startWidth + 'px';
					box.style.height = startHeight + 'px';
					
					function onResizeMove(moveEvent)
					{
						const newWidth = Math.max(280, startWidth + (moveEvent.clientX - startX));
						const newHeight = Math.max(120, startHeight + (moveEvent.clientY - startY));
						box.style.width = newWidth + 'px';
						box.style.height = newHeight + 'px';
					}
					
					function onResizeUp()
					{
						window.removeEventListener('mousemove', onResizeMove);
						window.removeEventListener('mouseup', onResizeUp);
						saveFloatingPosition();
					}
					
					window.addEventListener('mousemove', onResizeMove);
					window.addEventListener('mouseup', onResizeUp);
				}
			);
		}
		
		function checkAndRenderFloatingList()
		{
			const hostname = window.location.hostname;
			const floatingKey = 'floatingList_' + hostname;
			const posKey = 'floatingPos_' + hostname;
			
			chrome.storage.local.get
			(
				[hostname, floatingKey, posKey],
				function (result)
				{
					const snippets = result[hostname] || [];
					const isEnabled = !!result[floatingKey];
					const pos = result[posKey];
					
					if (isEnabled && snippets.length > 0)
					{
						renderFloatingList(snippets, pos);
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
