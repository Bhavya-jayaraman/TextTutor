package com.texttutor.dto;

public class KeywordExplainRequest {

    private String keyword;
    private String contextTitle;

    public KeywordExplainRequest() {}

    public KeywordExplainRequest(String keyword, String contextTitle) {
        this.keyword = keyword;
        this.contextTitle = contextTitle;
    }

    public String getKeyword() { return keyword; }
    public void setKeyword(String keyword) { this.keyword = keyword; }

    public String getContextTitle() { return contextTitle; }
    public void setContextTitle(String contextTitle) { this.contextTitle = contextTitle; }
}
