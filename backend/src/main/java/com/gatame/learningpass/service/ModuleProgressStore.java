package com.gatame.learningpass.service;

import com.gatame.learningpass.dto.progress.ModuleProgressEntryDto;
import com.gatame.learningpass.dto.progress.SessionProgressResponse;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * セッション単位のモジュール進捗（TODO チェック・メモ）をインメモリ保持。
 * 永続化 DB は未接続のため、サーバー再起動で消えます。
 */
@Service
public class ModuleProgressStore {

    private static final Logger log = LoggerFactory.getLogger(ModuleProgressStore.class);

    private final ConcurrentHashMap<String, ConcurrentHashMap<String, ModuleState>> bySession = new ConcurrentHashMap<>();

    private ConcurrentHashMap<String, ModuleState> modulesFor(String sessionKey) {
        return bySession.computeIfAbsent(sessionKey, k -> new ConcurrentHashMap<>());
    }

    public void updateTodo(String sessionKey, String moduleId, String itemId, boolean checked) {
        ModuleState st = modulesFor(sessionKey).computeIfAbsent(moduleId, id -> new ModuleState());
        if (checked) {
            st.getCheckedItems().put(itemId, Boolean.TRUE);
        } else {
            st.getCheckedItems().remove(itemId);
        }
        log.debug("progress todo session={} module={} item={} checked={}", sessionKey, moduleId, itemId, checked);
    }

    public void updateMemo(String sessionKey, String moduleId, String memo) {
        ModuleState st = modulesFor(sessionKey).computeIfAbsent(moduleId, id -> new ModuleState());
        st.setMemo(memo == null ? "" : memo);
        log.debug("progress memo session={} module={} len={}", sessionKey, moduleId, st.getMemo().length());
    }

    public SessionProgressResponse snapshotSession(String sessionKey) {
        ConcurrentHashMap<String, ModuleState> mods = bySession.get(sessionKey);
        if (mods == null || mods.isEmpty()) {
            return new SessionProgressResponse(Collections.emptyMap());
        }
        Map<String, ModuleProgressEntryDto> out = new ConcurrentHashMap<>();
        mods.forEach(
                (moduleId, st) ->
                        out.put(
                                moduleId,
                                new ModuleProgressEntryDto(
                                        Map.copyOf(st.getCheckedItems()), st.getMemo())));
        return new SessionProgressResponse(out);
    }

    public void logModuleFeedback(
            String sessionKey,
            String moduleId,
            String difficulty,
            int satisfaction,
            String videoRequestNote) {
        log.info(
                "module_feedback session={} module={} difficulty={} satisfaction={} videoNoteChars={}",
                sessionKey,
                moduleId,
                difficulty,
                satisfaction,
                videoRequestNote == null ? 0 : videoRequestNote.length());
    }

    public static final class ModuleState {
        private final ConcurrentHashMap<String, Boolean> checkedItems = new ConcurrentHashMap<>();
        private volatile String memo = "";

        public ConcurrentHashMap<String, Boolean> getCheckedItems() {
            return checkedItems;
        }

        public String getMemo() {
            return memo;
        }

        public void setMemo(String m) {
            this.memo = m == null ? "" : m;
        }
    }
}
