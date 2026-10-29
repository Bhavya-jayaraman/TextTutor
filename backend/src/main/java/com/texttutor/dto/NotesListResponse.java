package com.texttutor.dto;

import java.util.List;

public class NotesListResponse {

    private boolean success;
    private List<NoteDto> notes;

    public NotesListResponse() {}

    public NotesListResponse(boolean success, List<NoteDto> notes) {
        this.success = success;
        this.notes = notes;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public List<NoteDto> getNotes() { return notes; }
    public void setNotes(List<NoteDto> notes) { this.notes = notes; }
}
