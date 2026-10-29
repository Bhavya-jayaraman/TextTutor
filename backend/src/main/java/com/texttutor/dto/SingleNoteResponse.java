package com.texttutor.dto;

public class SingleNoteResponse {

    private boolean success;
    private String message;
    private NoteDto note;

    public SingleNoteResponse() {}

    public SingleNoteResponse(boolean success, String message, NoteDto note) {
        this.success = success;
        this.message = message;
        this.note = note;
    }

    public SingleNoteResponse(boolean success, NoteDto note) {
        this.success = success;
        this.note = note;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public NoteDto getNote() { return note; }
    public void setNote(NoteDto note) { this.note = note; }
}
