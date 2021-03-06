package org.devgateway.ocds.persistence.mongo.reader;

import java.io.Serializable;
import org.apache.poi.ss.usermodel.DateUtil;
import org.devgateway.ocds.persistence.mongo.spring.ImportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.math.BigDecimal;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

/**
 * Generic superclass for importing rows from excel data sources
 *
 * @param <T>  - the type of OCDS/dervied entity to be imported
 * @param <ID> the id type
 * @param <R>  - the main repository that is able to save <T>
 * @author mpostelnicu
 */
public abstract class RowImporter<T, ID extends Serializable, R extends MongoRepository<T, ID>> {

    private final Logger logger = LoggerFactory.getLogger(RowImporter.class);

    protected R repository;

    protected ImportService importService;

    protected int skipRows;
    protected int cursorRowNo = 0;
    protected int importedRows = 0;

    public RowImporter(final R repository, final ImportService importService, final int skipRows) {
        this.repository = repository;
        this.importService = importService;
        this.skipRows = skipRows;
    }

    /**
     * Returns a double number, checking the {@link NumberFormatException} and
     * wrapping the error into a {@link RuntimeException} that can be thrown
     * later
     *
     * @param string
     * @return
     */
    public Double getDouble(final String string) {
        try {
            return Double.parseDouble(string);
        } catch (NumberFormatException e) {
            throw new RuntimeException("Cell value " + string + " is not a valid number.");
        }
    }

    public BigDecimal getDecimal(final String string) {
        try {
            return new BigDecimal(string);
        } catch (NumberFormatException e) {
            throw new RuntimeException("Cell value " + string + " is not a valid decimal.");
        }
    }

    public Integer getInteger(final String string) {
        try {
            return Integer.parseInt(string);
        } catch (NumberFormatException e) {
            throw new RuntimeException("Cell value " + string + " is not a valid integer.");
        }
    }

    public Date getDateFromString(final SimpleDateFormat sdf, final String string) {
        try {
            return sdf.parse(string);
        } catch (ParseException e) {
            throw new RuntimeException(
                    "Cell value " + string + " is not a valid date. Use format " + sdf.getNumberFormat().toString());
        }
    }

    public Date getExcelDate(final String string) {
        try {
            return DateUtil.getJavaCalendar(Double.parseDouble(string)).getTime();
        } catch (NumberFormatException e) {
            throw new RuntimeException("Cell value " + string + " is not a valid Excel date.");
        }
    }

    private boolean isRowEmpty(final String[] row) {
        for (int i = 0; i < row.length; i++) {
            if (!row[i].trim().isEmpty()) {
                return false;
            }
        }
        return true;
    }

    public boolean importRows(final List<String[]> rows) throws ParseException {
        boolean r = true;
        for (String[] row : rows) {
            if (cursorRowNo++ < skipRows || isRowEmpty(row)) {
                continue;
            }

            try {
                importRow(row);
                importedRows++;
            } catch (Exception e) {
                boolean criticalError = true;
                if (e instanceof ImportWarningRuntimeException) {
                    criticalError = false;
                } else {
                    r = false;
                }
                importService.logMessage(
                        "<font style='" + (criticalError ? "color:red" : "") + "'>"
                                + (criticalError ? "CRITICAL " : "") + "Problem importing row "
                                + cursorRowNo + ". " + e + "</font>");
            }
        }

        logger.debug("Finished importing " + importedRows + " rows.");
        return r;
    }

    public abstract void importRow(String[] row) throws ParseException;

}
