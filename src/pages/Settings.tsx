import { useMeterSettingsStore } from "@/stores/useMeterSettingsStore";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  ColorInput,
  Divider,
  Fieldset,
  Flex,
  Group,
  Menu,
  Select,
  Slider,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { DotsSixVertical } from "@phosphor-icons/react";
import { invoke } from "@tauri-apps/api";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import useSettings from "./useSettings";

type DatabaseTransferResponse = {
  sourcePath: string;
  destinationPath: string;
  backupPath?: string | null;
};

type SettingsExportPayload = {
  version: number;
  meterSettings: unknown;
  language?: string | null;
  exportedAt?: string | null;
  source?: string | null;
};

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const [debugMode, setDebugMode] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  const {
    color_1,
    color_2,
    color_3,
    color_4,
    transparency,
    show_display_names,
    streamer_mode,
    show_full_values,
    use_condensed_skills,
    setMeterSettings,
    languages,
    handleLanguageChange,
    overlay_columns,
    handleReorderOverlayColumns,
    availableOverlayColumns,
    addOverlayColumn,
    removeOverlayColumn,
    open_log_on_save,
  } = useSettings();

  const toggleDebugMode = () => {
    const enabled = !debugMode;
    setDebugMode(enabled);
    invoke("set_debug_mode", { enabled });
    console.info("Debug Mode:", enabled ? "Enabled" : "Disabled");
  };

  const showDatabaseImportResult = (result: DatabaseTransferResponse) => {
    const backupMessage = result.backupPath ? ` Backup: ${result.backupPath}` : "";
    toast.success(`Imported logs database from ${result.sourcePath}.${backupMessage}`);
  };

  const showDatabaseExportResult = (result: DatabaseTransferResponse) => {
    const backupMessage = result.backupPath ? ` Backup: ${result.backupPath}` : "";
    toast.success(`Exported An0Mas logs database to ${result.destinationPath}.${backupMessage}`);
  };

  const importOriginalLogsDatabase = async () => {
    if (!window.confirm(t("ui.import-logs-database-confirmation"))) return;

    setIsMigrating(true);
    try {
      const result = await invoke<DatabaseTransferResponse>("import_original_logs_database");
      showDatabaseImportResult(result);
    } catch (e) {
      toast.error(`Failed to import original logs database: ${e}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const importLogsDatabaseFromFile = async () => {
    if (!window.confirm(t("ui.import-logs-database-confirmation"))) return;

    setIsMigrating(true);
    try {
      const result = await invoke<DatabaseTransferResponse>("import_logs_database_from_file");
      showDatabaseImportResult(result);
    } catch (e) {
      toast.error(`Failed to import logs database: ${e}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const exportLogsDatabaseToOriginal = async () => {
    if (!window.confirm(t("ui.export-original-logs-database-confirmation"))) return;

    setIsMigrating(true);
    try {
      const result = await invoke<DatabaseTransferResponse>("export_logs_database_to_original");
      showDatabaseExportResult(result);
    } catch (e) {
      toast.error(`Failed to export logs database to original GBFR Logs: ${e}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const currentSettingsPayload = (): SettingsExportPayload => ({
    version: 1,
    meterSettings: JSON.parse(localStorage.getItem("meter-settings") ?? "{}"),
    language: localStorage.getItem("i18nextLng") ?? i18n.language,
    exportedAt: new Date().toISOString(),
    source: "GBFR Logs An0Mas",
  });

  const applySettingsPayload = async (payload: SettingsExportPayload) => {
    if (!payload.meterSettings) {
      throw new Error("Selected settings file does not contain meterSettings.");
    }

    localStorage.setItem("meter-settings", JSON.stringify(payload.meterSettings));

    if (payload.language) {
      localStorage.setItem("i18nextLng", payload.language);
      await i18n.changeLanguage(payload.language);
    }

    useMeterSettingsStore.persist.rehydrate();
  };

  const exportSettingsToFile = async () => {
    setIsMigrating(true);
    try {
      const filePath = await invoke<string>("export_settings_to_file", { payload: currentSettingsPayload() });
      toast.success(`Exported settings to ${filePath}`);
    } catch (e) {
      toast.error(`Failed to export settings: ${e}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const importSettingsFromFile = async () => {
    if (!window.confirm(t("ui.import-settings-confirmation"))) return;

    setIsMigrating(true);
    try {
      const payload = await invoke<SettingsExportPayload>("import_settings_from_file");
      await applySettingsPayload(payload);
      toast.success("Imported settings.");
    } catch (e) {
      toast.error(`Failed to import settings: ${e}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const importSettingsFromOriginal = async () => {
    if (!window.confirm(t("ui.import-settings-confirmation"))) return;

    setIsMigrating(true);
    try {
      const payload = await invoke<SettingsExportPayload>("import_settings_from_original");
      await applySettingsPayload(payload);
      toast.success("Imported settings from original GBFR Logs.");
    } catch (e) {
      toast.error(`Failed to import original settings: ${e}`);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Box>
      <Fieldset legend={t("ui.meter-settings")}>
        <Stack>
          <Select
            label={t("ui.language")}
            data={languages}
            defaultValue={i18n.language}
            allowDeselect={false}
            onChange={handleLanguageChange}
          />
          <ColorInput
            defaultValue={color_1}
            onChangeEnd={(value) => setMeterSettings({ color_1: value })}
            withEyeDropper={false}
            label={t("ui.player-1-color")}
            placeholder="Color"
          />
          <ColorInput
            defaultValue={color_2}
            onChangeEnd={(value) => setMeterSettings({ color_2: value })}
            withEyeDropper={false}
            label={t("ui.player-2-color")}
            placeholder="Color"
          />
          <ColorInput
            defaultValue={color_3}
            onChangeEnd={(value) => setMeterSettings({ color_3: value })}
            withEyeDropper={false}
            label={t("ui.player-3-color")}
            placeholder="Color"
          />
          <ColorInput
            defaultValue={color_4}
            onChangeEnd={(value) => setMeterSettings({ color_4: value })}
            withEyeDropper={false}
            label={t("ui.player-4-color")}
            placeholder="Color"
          />
          <Text size="sm">{t("ui.meter-transparency")}</Text>
          <Slider
            min={0}
            max={1}
            step={0.005}
            defaultValue={transparency}
            onChangeEnd={(value) => setMeterSettings({ transparency: value })}
          />
          <Checkbox
            label={t("ui.show-player-names")}
            checked={show_display_names}
            onChange={(event) => setMeterSettings({ show_display_names: event.currentTarget.checked })}
          />
          <Tooltip label={t("ui.streamer-mode-description")}>
            <Checkbox
              label={t("ui.streamer-mode")}
              checked={streamer_mode}
              onChange={(event) => setMeterSettings({ streamer_mode: event.currentTarget.checked })}
            />
          </Tooltip>
          <Tooltip label={t("ui.show-full-values-description")}>
            <Checkbox
              label={t("ui.show-full-values")}
              checked={show_full_values}
              onChange={(event) => setMeterSettings({ show_full_values: event.currentTarget.checked })}
            />
          </Tooltip>
          <Tooltip label={t("ui.use-condensed-skills-description")}>
            <Checkbox
              label={t("ui.use-condensed-skills")}
              checked={use_condensed_skills}
              onChange={(event) => setMeterSettings({ use_condensed_skills: event.currentTarget.checked })}
            />
          </Tooltip>
          <Tooltip label={t("ui.open-log-on-save-description")}>
            <Checkbox
              label={t("ui.open-log-on-save")}
              checked={open_log_on_save}
              onChange={(event) => setMeterSettings({ open_log_on_save: event.currentTarget.checked })}
            />
          </Tooltip>
          <Tooltip label={t("ui.debug-mode-description")}>
            <Checkbox label={t("ui.debug-mode")} checked={debugMode} onChange={toggleDebugMode} />
          </Tooltip>
          <Divider />
          <Text size="sm">Customize Overlay Meter Columns</Text>
          <Menu shadow="md" trigger="hover" openDelay={100} closeDelay={400}>
            <Menu.Target>
              <Button>Add column</Button>
            </Menu.Target>
            <Menu.Dropdown>
              {availableOverlayColumns.map((item) => (
                <Menu.Item key={item} onClick={() => addOverlayColumn(item)}>
                  {t(`ui.meter-columns.${item}`)} - {t(`ui.meter-columns.${item}-description`)}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
          <DragDropContext onDragEnd={handleReorderOverlayColumns}>
            <Droppable droppableId="overlay-columns">
              {(droppableProvided) => (
                <Stack ref={droppableProvided.innerRef}>
                  {overlay_columns.map((item, index) => (
                    <Draggable key={item} draggableId={item} index={index}>
                      {(draggableProvided) => (
                        <Box
                          bg="var(--mantine-color-dark-8)"
                          display="flex"
                          p={10}
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                          {...draggableProvided.dragHandleProps}
                        >
                          <Flex align="center" flex={1}>
                            <DotsSixVertical size={16} style={{ cursor: "grab", marginRight: "0.5em" }} />
                            {t(`ui.meter-columns.${item}`)} - {t(`ui.meter-columns.${item}-description`)}
                          </Flex>
                          <Flex align="center">
                            <ActionIcon
                              aria-label="Remove column"
                              variant="transparent"
                              color="gray"
                              onClick={() => removeOverlayColumn(item)}
                            >
                              x
                            </ActionIcon>
                          </Flex>
                        </Box>
                      )}
                    </Draggable>
                  ))}
                  {droppableProvided.placeholder}
                </Stack>
              )}
            </Droppable>
          </DragDropContext>
        </Stack>
      </Fieldset>
      <Fieldset legend={t("ui.data-migration")} mt="md">
        <Stack>
          <Text size="sm">{t("ui.logs-database")}</Text>
          <Group>
            <Button loading={isMigrating} onClick={importOriginalLogsDatabase}>
              {t("ui.import-original-logs-database")}
            </Button>
            <Button loading={isMigrating} variant="light" onClick={importLogsDatabaseFromFile}>
              {t("ui.import-selected-logs-database")}
            </Button>
            <Button loading={isMigrating} variant="light" color="orange" onClick={exportLogsDatabaseToOriginal}>
              {t("ui.export-original-logs-database")}
            </Button>
          </Group>
          <Divider />
          <Text size="sm">{t("ui.app-settings")}</Text>
          <Group>
            <Button loading={isMigrating} onClick={importSettingsFromOriginal}>
              {t("ui.import-original-settings")}
            </Button>
            <Button loading={isMigrating} variant="light" onClick={importSettingsFromFile}>
              {t("ui.import-settings-file")}
            </Button>
            <Button loading={isMigrating} variant="light" onClick={exportSettingsToFile}>
              {t("ui.export-settings-file")}
            </Button>
          </Group>
        </Stack>
      </Fieldset>
    </Box>
  );
};

export default SettingsPage;
