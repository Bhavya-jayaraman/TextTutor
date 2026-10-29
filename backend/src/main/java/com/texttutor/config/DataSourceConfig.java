package com.texttutor.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DriverManager;

@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${spring.datasource.url:jdbc:mysql://localhost:3306/texttutor?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC}")
    private String mysqlUrl;

    @Value("${spring.datasource.username:root}")
    private String mysqlUsername;

    @Value("${spring.datasource.password:}")
    private String mysqlPassword;

    @Value("${spring.datasource.driver-class-name:com.mysql.cj.jdbc.Driver}")
    private String mysqlDriverClassName;

    @Bean
    @Primary
    @Profile("!test")
    public DataSource dataSource() {
        try {
            log.info("Testing connection to primary database at {}", mysqlUrl);
            Class.forName(mysqlDriverClassName);
            DriverManager.setLoginTimeout(3);
            try (Connection conn = DriverManager.getConnection(mysqlUrl, mysqlUsername, mysqlPassword)) {
                log.info("Successfully connected to primary MySQL database at {}!", mysqlUrl);
                HikariConfig config = new HikariConfig();
                config.setJdbcUrl(mysqlUrl);
                config.setUsername(mysqlUsername);
                config.setPassword(mysqlPassword);
                config.setDriverClassName(mysqlDriverClassName);
                config.setMaximumPoolSize(10);
                config.setMinimumIdle(2);
                config.setPoolName("TextTutorHikariPool-MySQL");
                return new HikariDataSource(config);
            }
        } catch (Exception ex) {
            log.warn("Primary MySQL connection could not be established ({}: {}). Activating persistent local storage fallback.",
                    ex.getClass().getSimpleName(), ex.getMessage());
            log.info("Initializing persistent local database at ./data/texttutor_db with MySQL compatibility mode.");

            HikariConfig fallbackConfig = new HikariConfig();
            fallbackConfig.setJdbcUrl("jdbc:h2:file:./data/texttutor_db;DB_CLOSE_DELAY=-1;MODE=MySQL");
            fallbackConfig.setDriverClassName("org.h2.Driver");
            fallbackConfig.setUsername("sa");
            fallbackConfig.setPassword("");
            fallbackConfig.setMaximumPoolSize(10);
            fallbackConfig.setMinimumIdle(2);
            fallbackConfig.setPoolName("TextTutorHikariPool-LocalPersistent");
            return new HikariDataSource(fallbackConfig);
        }
    }
}
