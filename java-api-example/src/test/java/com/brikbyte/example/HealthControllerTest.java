package com.brikbyte.example;

import com.brikbyte.example.controller.HealthController;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

public class HealthControllerTest {

    @Test
    void healthEndpointReturnsOK() {
        HealthController controller = new HealthController();
        assertThat(controller.health()).isEqualTo("OK");
    }
}
