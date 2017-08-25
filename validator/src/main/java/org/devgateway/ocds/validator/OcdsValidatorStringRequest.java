package org.devgateway.ocds.validator;

import io.swagger.annotations.ApiModelProperty;
import java.util.SortedSet;

/**
 * Created by mpostelnicu on 7/6/17.
 */
public class OcdsValidatorStringRequest extends OcdsValidatorRequest {

    @ApiModelProperty(value = "The json to validate against OCDS schema, given as text.")
    private String json;


    public OcdsValidatorStringRequest(String version, SortedSet<String> extensions, String schemaType) {
        super(version, extensions, schemaType);
    }

    public OcdsValidatorStringRequest() {
        super();
    }

    public String getJson() {
        return json;
    }

    public void setJson(String json) {
        this.json = json;
    }

}
