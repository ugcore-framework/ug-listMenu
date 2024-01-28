local UgCore = exports['ug-core']:GetCore()

CreateThread(function()
	local MenuType    = 'list'
	local OpennedMenus = {}

	local function OpenMenu(namespace, name, data)
		OpennedMenus[namespace .. '_' .. name] = true

		SendNUIMessage({
			action    = 'openMenu',
			namespace = namespace,
			name      = name,
			data      = data
		})
		SetTimeout(200, function()
			SetNuiFocus(true, true)
		end)
	end

	local function CloseMenu(namespace, name)
		OpennedMenus[namespace .. '_' .. name] = nil
		local OpennedMenuCount = 0

		SendNUIMessage({
			action    = 'closeMenu',
			namespace = namespace,
			name      = name,
		})

		for _, v in pairs(OpennedMenus) do
			if v then
				OpennedMenuCount = OpennedMenuCount + 1
			end
		end

		if OpennedMenuCount == 0 then
			SetNuiFocus(false)
		end
	end

	UgCore.Menus.Functions.RegisterType(MenuType, OpenMenu, CloseMenu)

	RegisterNUICallback('menu_submit', function(data, cb)
		local menu = UgCore.Menus.Functions.GetMenuOpened(MenuType, data._namespace, data._name)
		if menu.submit then
			menu.submit(data, menu)
		end
		cb('OK')
	end)

	RegisterNUICallback('menu_cancel', function(data, cb)
		local menu = UgCore.Menus.Functions.GetMenuOpened(MenuType, data._namespace, data._name)

		if menu.cancel ~= nil then
			menu.cancel(data, menu)
		end

		cb('OK')
	end)
end)