package org.devgateway.ocds.validator.web;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import springfox.documentation.builders.ApiInfoBuilder;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.service.ApiInfo;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spring.web.plugins.Docket;
import springfox.documentation.swagger2.annotations.EnableSwagger2;


import static springfox.documentation.builders.PathSelectors.regex;

@Configuration
@EnableSwagger2
public class ValidatorSwaggerConfig {


    @Bean
    public Docket validatorApi() {
        return new Docket(DocumentationType.SWAGGER_2).groupName("3validator")
                .select().apis(RequestHandlerSelectors.any()).paths(regex("/api/ocds/validator/.*")).build();
    }

    private ApiInfo ocDashboardsApiInfo() {
        return new ApiInfoBuilder().title("Open Contracting Dashboards API")
                .description("These endpoints are used to feed the open contracting dashboard").license("MIT License")
                .licenseUrl("https://opensource.org/licenses/MIT").version("1.0").build();
    }

}