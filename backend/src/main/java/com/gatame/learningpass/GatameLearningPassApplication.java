package com.gatame.learningpass;

import com.gatame.learningpass.config.GatameCorsProperties;
import com.gatame.learningpass.config.GatameLayoutProperties;
import com.gatame.learningpass.config.GatameScoringProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({
    GatameScoringProperties.class,
    GatameLayoutProperties.class,
    GatameCorsProperties.class
})
public class GatameLearningPassApplication {

    public static void main(String[] args) {
        SpringApplication.run(GatameLearningPassApplication.class, args);
    }
}
