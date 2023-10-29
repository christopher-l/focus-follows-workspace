'use strict';

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class FocusFollowsWorkspaceExtensionPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup();
        page.add(group);

        const row = new Adw.ActionRow({
            title: 'Move cursor to the primary monitor',
            subtitle: 'When switching workspaces',
        });
        group.add(row);

        const toggle = new Gtk.Switch({
            active: settings.get_boolean('move-cursor'),
            valign: Gtk.Align.CENTER,
        });
        settings.bind('move-cursor', toggle, 'active', Gio.SettingsBindFlags.DEFAULT);

        row.add_suffix(toggle);
        row.activatable_widget = toggle;

        window.add(page);
    }
}
