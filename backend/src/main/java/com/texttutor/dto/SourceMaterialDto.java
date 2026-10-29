package com.texttutor.dto;

public class SourceMaterialDto {

    private Long id;
    private String title;
    private String category;
    private Integer pageNumber;
    private String sectionHeading;
    private String excerpt;

    public SourceMaterialDto() {}

    public SourceMaterialDto(Long id, String title, String category) {
        this.id = id;
        this.title = title;
        this.category = category;
        this.pageNumber = 1;
        this.sectionHeading = "General";
        this.excerpt = "";
    }

    public SourceMaterialDto(Long id, String title, String category, Integer pageNumber, String sectionHeading, String excerpt) {
        this.id = id;
        this.title = title;
        this.category = category;
        this.pageNumber = pageNumber != null ? pageNumber : 1;
        this.sectionHeading = sectionHeading != null ? sectionHeading : "General";
        this.excerpt = excerpt != null ? excerpt : "";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Integer getPageNumber() { return pageNumber; }
    public void setPageNumber(Integer pageNumber) { this.pageNumber = pageNumber; }

    public String getSectionHeading() { return sectionHeading; }
    public void setSectionHeading(String sectionHeading) { this.sectionHeading = sectionHeading; }

    public String getExcerpt() { return excerpt; }
    public void setExcerpt(String excerpt) { this.excerpt = excerpt; }
}
