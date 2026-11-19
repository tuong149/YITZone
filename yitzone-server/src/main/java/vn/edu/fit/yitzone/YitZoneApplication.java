package vn.edu.fit.yitzone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class YitZoneApplication {

    public static void main(String[] args) {
        SpringApplication.run(YitZoneApplication.class, args);
    }
}
