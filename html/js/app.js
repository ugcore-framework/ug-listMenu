(function () {
    let MenuTpl =
        '<div id="menu_{{_namespace}}_{{_name}}" class="menu">' +
        "<table>" +
        "<thead>" +
        "<tr>" +
        "{{#head}}<td>{{content}}</td>{{/head}}" +
        "</tr>" +
        "</thead>" +
        "<tbody>" +
        "{{#rows}}" +
        "<tr>" +
        "{{#cols}}<td>{{{content}}}</td>{{/cols}}" +
        "</tr>" +
        "{{/rows}}" +
        "</tbody>" +
        "</table>" +
        "</div>";
    window.UgCore = {};
    UgCore.ResourceName = "ug-listMenu";
    UgCore.Openned = {};
    UgCore.Focus = [];
    UgCore.Data = {};

    UgCore.open = function (namespace, name, data) {
        if (typeof UgCore.Openned[namespace] === "undefined") {
            UgCore.Openned[namespace] = {};
        }

        if (typeof UgCore.Openned[namespace][name] != "undefined") {
            UgCore.close(namespace, name);
        }

        data._namespace = namespace;
        data._name = name;

        UgCore.Openned[namespace][name] = data;

        UgCore.Focus.push({
            namespace: namespace,
            name: name,
        });

        UgCore.render();
    };

    UgCore.close = function (namespace, name) {
        delete UgCore.Openned[namespace][name];

        for (let i = 0; i < UgCore.Focus.length; i++) {
            if (UgCore.Focus[i].namespace === namespace && UgCore.Focus[i].name === name) {
                UgCore.Focus.splice(i, 1);
                break;
            }
        }

        UgCore.render();
    };

    UgCore.render = function () {
        let menuContainer = document.getElementById("menus");
        let Focused = UgCore.getFocused();
        menuContainer.innerHTML = "";

        $(menuContainer).hide();

        for (let namespace in UgCore.Openned) {
            if (typeof UgCore.Data[namespace] === "undefined") {
                UgCore.Data[namespace] = {};
            }

            for (let name in UgCore.Openned[namespace]) {
                UgCore.Data[namespace][name] = [];

                let menuData = UgCore.Openned[namespace][name];
                let view = {
                    _namespace: menuData._namespace,
                    _name: menuData._name,
                    head: [],
                    rows: [],
                };

                for (let i = 0; i < menuData.head.length; i++) {
                    let item = { content: menuData.head[i] };
                    view.head.push(item);
                }

                for (let i = 0; i < menuData.rows.length; i++) {
                    let row = menuData.rows[i];
                    let data = row.data;

                    UgCore.Data[namespace][name].push(data);

                    view.rows.push({ cols: [] });

                    for (let j = 0; j < row.cols.length; j++) {
                        let col = menuData.rows[i].cols[j];
                        let regex = /\{\{(.*?)\|(.*?)\}\}/g;
                        let matches = [];
                        let match;

                        while ((match = regex.exec(col)) != null) {
                            matches.push(match);
                        }

                        for (let k = 0; k < matches.length; k++) {
                            col = col.replace("{{" + matches[k][1] + "|" + matches[k][2] + "}}", '<button data-id="' + i + '" data-namespace="' + namespace + '" data-name="' + name + '" data-value="' + matches[k][2] + '">' + matches[k][1] + "</button>");
                        }

                        view.rows[i].cols.push({ data: data, content: col });
                    }
                }

                let menu = $(Mustache.render(MenuTpl, view));

                menu.find("button[data-namespace][data-name]").click(function () {
                    UgCore.Data[$(this).data("namespace")][$(this).data("name")][parseInt($(this).data("id"))].currentRow = parseInt($(this).data("id")) + 1;
                    UgCore.submit($(this).data("namespace"), $(this).data("name"), {
                        data: UgCore.Data[$(this).data("namespace")][$(this).data("name")][parseInt($(this).data("id"))],
                        value: $(this).data("value"),
                    });
                });

                menu.hide();

                menuContainer.appendChild(menu[0]);
            }
        }

        if (typeof Focused != "undefined") {
            $("#menu_" + Focused.namespace + "_" + Focused.name).show();
        }

        $(menuContainer).show();
    };

    UgCore.submit = function (namespace, name, data) {
        $.post(`https://${UgCore.ResourceName}/menu_submit`,
            JSON.stringify({
                _namespace: namespace,
                _name: name,
                data: data.data,
                value: data.value,
            })
        );
    };

    UgCore.cancel = function (namespace, name) {
        $.post(`https://${UgCore.ResourceName}/menu_cancel`,
            JSON.stringify({
                _namespace: namespace,
                _name: name,
            })
        );
    };

    UgCore.getFocused = function () {
        return UgCore.Focus[UgCore.Focus.length - 1];
    };

    window.onData = (data) => {
        switch (data.action) {
            case "openMenu": {
                UgCore.open(data.namespace, data.name, data.data);
                break;
            }

            case "closeMenu": {
                UgCore.close(data.namespace, data.name);
                break;
            }
        }
    };

    window.onload = function (e) {
        window.addEventListener("message", (event) => {
            onData(event.data);
        });
    };

    document.onkeyup = function (data) {
        if (data.which === 27) {
            let Focused = UgCore.getFocused();
            UgCore.cancel(Focused.namespace, Focused.name);
        }
    };
})();